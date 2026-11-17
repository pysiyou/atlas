-- DESTRUCTIVE dev reset: wipes orders, samples, order tests, and ALL catalog rows.
-- Patients, users, and referent doctors are kept. Order and lab HISTORY is deleted.
-- After running this file, restart the API (create_all + contract seed + schema finalize).

TRUNCATE order_tests, samples, orders RESTART IDENTITY CASCADE;

DROP TABLE IF EXISTS catalog_panels CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS orderable_test_analytes CASCADE;
DROP TABLE IF EXISTS clinical_workup_tests CASCADE;
DROP TABLE IF EXISTS orderable_tests CASCADE;
DROP TABLE IF EXISTS catalog_analytes CASCADE;
DROP TABLE IF EXISTS clinical_workups CASCADE;