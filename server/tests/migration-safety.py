"""Exercise the real migration against synthetic data on a disposable LOCAL MariaDB.

Requires an already initialized temporary server, bound to 127.0.0.1:33318.
The datadir and MariaDB version are checked BEFORE any database is created/reset.
Usage: python server/tests/migration-safety.py --audit-dir TEMP_DIR --schema DUMP_FILE
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tempfile
import time

parser = argparse.ArgumentParser()
parser.add_argument('--audit-dir', type=Path, required=True)
parser.add_argument('--schema', type=Path, required=True)
parser.add_argument('--report', type=Path, required=True)
args = parser.parse_args()
audit = args.audit_dir.resolve()
assert audit.parent == Path(tempfile.gettempdir()).resolve()
assert audit.name.startswith('eternalzone-mariadb-audit-')
client = audit / 'mariadb-11.8.9-winx64/bin/mariadb.exe'
command = [str(client), '--no-defaults', '--protocol=TCP', '--host=127.0.0.1',
           '--port=33318', '--user=root', '--default-character-set=utf8mb4',
           '--batch', '--raw', '--skip-column-names']
database = 'dayzstal_eternalzone'
project = Path(__file__).resolve().parents[2]
migration = (project / 'server/database/upgrade_uk_en_all.sql').read_text(encoding='utf-8')
schema = args.schema.read_text(encoding='utf-8')


def run(sql, fail=False, force=False):
    result = subprocess.run(command + (['--force'] if force else []), input=sql,
                            text=True, encoding='utf-8', capture_output=True, timeout=30)
    if fail:
        assert 'ERROR ' in result.stderr, f'Expected SQL failure: {result.stdout}'
        return result
    assert result.returncode == 0, result.stderr
    assert 'ERROR ' not in result.stderr, result.stderr
    return result.stdout.strip()


version, datadir = run('SELECT VERSION(), @@datadir;').split('\t')
assert version == '11.8.9-MariaDB', version
assert Path(datadir).resolve() == (audit / 'data').resolve(), 'Wrong datadir: refuse to run'


def literal(value):
    data = str(value).encode('utf-8').hex()
    return f'CONVERT(0x{data} USING utf8mb4)' if data else "''"


def reset():
    # Safe only after the hardcoded loopback port, temporary datadir and version checks above.
    run(f'DROP DATABASE IF EXISTS `{database}`; CREATE DATABASE `{database}` '
        f'CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; USE `{database}`;\n' + schema)
    statements = [
        "INSERT INTO users (id,steam_id,steam_nickname,rules_passed) VALUES ('u1','s1','Тестовий гравець',1)",
        "INSERT INTO face_models (id,name,gender,is_unique) VALUES ('f1','Обличчя 01','male',1)",
        "INSERT INTO rules_categories (id,name) VALUES ('rc1','Правила')",
        "INSERT INTO rules (id,number,category_id,title,content) VALUES ('r1','1','rc1','Основне правило','Оригінальний текст')",
        "INSERT INTO rules (id,number,category_id,parent_id,title,content) VALUES ('r2','1.1','rc1','r1','Підпункт','Текст підпункту')",
        "INSERT INTO rules_questions (id,question_text,category,incorrect_answers) VALUES ('q1','Що робити?','Основне','[\"Ні\",\"Так\"]')",
        "INSERT INTO faq_categories (id,name) VALUES ('fc1','Початок')",
        "INSERT INTO faq_items (id,category_id,question,answer) VALUES ('faq1','fc1','Як почати?','Прочитайте правила.')",
        "INSERT INTO media_videos (id,title,url) VALUES ('m1','Трейлер','https://example.test/video')",
    ]
    questions = json.dumps({'questions': ['Питання?'], 'answers': ['Відповідь з апострофом: об’єкт']}, ensure_ascii=False)
    statements.append('INSERT INTO rules_test_submissions (id,user_id,steam_id,discord_id,answers,question_grades,score,approved) '
                      f"VALUES ('t1','u1','s1','discord-test',{literal(questions)},'[true]',1,1)")
    run(f'USE `{database}`;\n' + ';\n'.join(statements) + ';')


def snapshot():
    table_names = run(f'SHOW TABLES FROM `{database}`;').splitlines()
    data = {}
    for table in table_names:
        columns = run("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS "
                      f"WHERE TABLE_SCHEMA='{database}' AND TABLE_NAME='{table}' ORDER BY ORDINAL_POSITION;").splitlines()
        data[table] = {'columns': columns, 'rows': [json.loads(line) for line in run(
            'SELECT JSON_ARRAY(' + ','.join(f'`{name}`' for name in columns) + ') '
            f'FROM `{database}`.`{table}` ORDER BY id;').splitlines()]}
    metadata = {}
    queries = {
        'columns': ('COLUMNS', 'TABLE_NAME,COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE,COLUMN_DEFAULT,CHARACTER_SET_NAME,COLLATION_NAME,EXTRA,ORDINAL_POSITION', 'TABLE_SCHEMA', 'TABLE_NAME,ORDINAL_POSITION'),
        'indexes': ('STATISTICS', 'TABLE_NAME,INDEX_NAME,COLUMN_NAME,SEQ_IN_INDEX,NON_UNIQUE,COLLATION', 'TABLE_SCHEMA', 'TABLE_NAME,INDEX_NAME,SEQ_IN_INDEX'),
        'keys': ('KEY_COLUMN_USAGE', 'TABLE_NAME,CONSTRAINT_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME', 'TABLE_SCHEMA', 'TABLE_NAME,CONSTRAINT_NAME,ORDINAL_POSITION'),
        'constraints': ('TABLE_CONSTRAINTS', 'TABLE_NAME,CONSTRAINT_NAME,CONSTRAINT_TYPE', 'CONSTRAINT_SCHEMA', 'TABLE_NAME,CONSTRAINT_NAME'),
        'checks': ('CHECK_CONSTRAINTS', 'TABLE_NAME,CONSTRAINT_NAME,CHECK_CLAUSE', 'CONSTRAINT_SCHEMA', 'TABLE_NAME,CONSTRAINT_NAME'),
        'tables': ('TABLES', 'TABLE_NAME,ENGINE,TABLE_COLLATION', 'TABLE_SCHEMA', 'TABLE_NAME'),
    }
    for key, (source, fields, schema_field, order) in queries.items():
        metadata[key] = [json.loads(line) for line in run(
            f'SELECT JSON_ARRAY({fields}) FROM INFORMATION_SCHEMA.{source} '
            f"WHERE {schema_field}='{database}' ORDER BY {order};").splitlines()]
    return {'data': data, 'metadata': metadata}


def assert_preserved(before, after):
    assert before['data'].keys() == after['data'].keys(), 'Table set changed'
    for name, original in before['data'].items():
        current = after['data'][name]
        positions = [current['columns'].index(column) for column in original['columns']]
        projected = [[row[index] for index in positions] for row in current['rows']]
        assert projected == original['rows'], f'Existing data changed in {name}'
    originals = {(row[0], row[1]) for row in before['metadata']['columns']}
    after_columns = [row for row in after['metadata']['columns'] if (row[0], row[1]) in originals]
    assert after_columns == before['metadata']['columns'], 'Existing column definitions/order changed'
    for key in ['indexes', 'keys', 'constraints', 'checks', 'tables']:
        assert before['metadata'][key] == after['metadata'][key], f'Metadata changed: {key}'


def count_new():
    return int(run(f"SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='{database}' "
                   "AND (COLUMN_NAME LIKE '%\\_en' OR (TABLE_NAME='rules_test_submissions' AND COLUMN_NAME='language'));"))


results = []


def passed(name):
    results.append({'scenario': name, 'status': 'passed'})
    print('PASS:', name, flush=True)


reset()
before = snapshot()
run(migration)
after = snapshot()
assert_preserved(before, after)
assert count_new() == 11
assert run(f'SELECT language FROM `{database}`.rules_test_submissions;') == 'uk'
passed('Fresh migration preserves all original rows, column definitions, indexes, foreign keys and JSON checks')

run(f"UPDATE `{database}`.rules SET title_en='Rule',content_en='English rule' WHERE id='r1'; "
    f"UPDATE `{database}`.rules_test_submissions SET language='en' WHERE id='t1'; "
    f"UPDATE `{database}`.faq_items SET question_en='Question?',answer_en='Answer.';")
before = snapshot()
run(migration)
assert snapshot() == before
passed('Repeated migration leaves existing Ukrainian/English data and all metadata unchanged')

reset()
run(f'USE `{database}`;\n' + (project / 'server/database/add_english_content.sql').read_text(encoding='utf-8'))
run(f"UPDATE `{database}`.rules SET title_en='Previously translated' WHERE id='r1';")
before = snapshot()
run(migration)
assert_preserved(before, snapshot())
assert count_new() == 11
passed('Migration after the previous six-column SQL preserves previous translations')

for name, setup, expected_error in [
    ('Incompatible existing English type', 'ALTER TABLE media_videos ADD COLUMN title_en INT DEFAULT NULL', 'Incompatible translation column'),
    ('Incompatible existing English default', "ALTER TABLE faq_items ADD COLUMN answer_en TEXT DEFAULT 'unexpected'", 'Incompatible translation column'),
    ('Changed original column type', 'ALTER TABLE faq_items MODIFY COLUMN answer LONGTEXT NOT NULL', 'Unexpected base column'),
    ('Missing required table', 'DROP TABLE media_videos', 'Missing table'),
    ('Unexpected storage engine', 'ALTER TABLE media_videos ENGINE=MyISAM', 'unexpected engine'),
]:
    reset()
    run(f'USE `{database}`; {setup};')
    before = snapshot()
    error = run(migration, fail=True, force=True)
    assert expected_error.lower() in error.stderr.lower(), error.stderr
    assert snapshot() == before
    passed(name + ': preflight rejects before any migration change, even with client --force')


def locked_migration(table, expected_additions):
    reset()
    before = snapshot()
    holder = subprocess.Popen(command + ['--unbuffered'], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                              stderr=subprocess.PIPE, text=True, encoding='utf-8')
    try:
        holder.stdin.write(f'START TRANSACTION; SELECT id FROM `{database}`.`{table}`; SELECT \'LOCK_READY\';\n')
        holder.stdin.flush()
        while holder.stdout.readline().strip() != 'LOCK_READY':
            assert holder.poll() is None, 'Lock holder exited unexpectedly'
        started = time.monotonic()
        error = run(migration, fail=True, force=True)
        elapsed = time.monotonic() - started
        assert 'lock wait timeout' in error.stderr.lower(), error.stderr
        assert 4 <= elapsed < 15, f'Unexpected wait: {elapsed}'
        assert count_new() == expected_additions
    finally:
        holder.stdin.write('ROLLBACK;\nquit\n')
        holder.stdin.flush()
        holder.communicate(timeout=10)
    assert_preserved(before, snapshot())
    run(migration)
    assert_preserved(before, snapshot())
    assert count_new() == 11


locked_migration('rules_categories', 0)
passed('First-table metadata lock times out after five seconds without adding columns')
locked_migration('media_videos', 9)
passed('Later metadata lock stops the block; rerun resumes partial DDL without changing original data')

reset()
before = snapshot()
error = run('START TRANSACTION; INSERT INTO dayzstal_eternalzone.users (id,steam_id,steam_nickname) '
            "VALUES ('uncommitted','uncommitted-steam','Uncommitted');\n" + migration + '\nROLLBACK;', fail=True, force=True)
assert 'outside any transaction' in error.stderr
assert count_new() == 0
assert snapshot() == before
passed('Existing transaction is rejected without committing the caller\'s uncommitted data')

reset()
output = run('SET SESSION lock_wait_timeout=37;\n' + migration + '\nSELECT @@SESSION.lock_wait_timeout;')
assert output.splitlines()[-1] == '37'
passed('Original session metadata-lock timeout is restored after success')

reset()
run(f'DROP TABLE `{database}`.media_videos;')
error = run('SET SESSION lock_wait_timeout=37;\n' + migration + '\nSELECT @@SESSION.lock_wait_timeout;', fail=True, force=True)
assert error.stdout.strip().splitlines()[-1] == '37'
assert count_new() == 0
passed('Original session metadata-lock timeout is restored after a preflight error')

run(f'DROP DATABASE `{database}`; DROP DATABASE IF EXISTS audit_other; CREATE DATABASE audit_other CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;')
run('USE audit_other;\n' + schema)
error = run('USE audit_other;\n' + migration, fail=True, force=True)
assert 'Wrong database' in error.stderr
assert run("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='audit_other' AND COLUMN_NAME LIKE '%\\_en';") == '0'
passed('Missing target database cannot redirect migration into another selected database')

report = {
    'server_version': version, 'connection': '127.0.0.1:33318',
    'schema_source': 'User-provided structure export; synthetic rows only',
    'migration_sha256': hashlib.sha256((project / 'server/database/upgrade_uk_en_all.sql').read_bytes()).hexdigest(),
    'production_contacted': False, 'scenarios_passed': len(results), 'scenarios': results,
}
args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'passed': len(results), 'report': str(args.report)}, ensure_ascii=False), flush=True)
