BEGIN;

UPDATE reservation
SET statut = CASE
    WHEN lower(replace(statut, 'é', 'e')) = 'reservee' THEN 'Réservée'
    WHEN lower(replace(statut, 'é', 'e')) = 'confirmee' THEN 'Confirmée'
    WHEN lower(replace(statut, 'é', 'e')) = 'annulee' THEN 'Annulée'
    WHEN lower(replace(statut, 'é', 'e')) = 'convertie' THEN 'Convertie'
    ELSE statut
END
WHERE statut IS NOT NULL
  AND trim(statut) <> '';

COMMIT;
