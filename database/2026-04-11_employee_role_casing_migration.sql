BEGIN;

UPDATE employe
SET role = CASE
    WHEN lower(replace(role, 'é', 'e')) = 'gestionnaire' THEN 'Gestionnaire'
    WHEN lower(replace(role, 'é', 'e')) = 'reception' THEN 'Réception'
    WHEN lower(replace(role, 'é', 'e')) = 'service' THEN 'Service'
    ELSE role
END
WHERE role IS NOT NULL
  AND trim(role) <> '';

COMMIT;
