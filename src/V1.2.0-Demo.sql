/* Parameterized Query - 'SO15371' */
SELECT 	id, tranid, foreignTotal, status
FROM	Transaction
WHERE	type = 'SalesOrd'
AND		tranid = ?

/* Synthetic Function - standardize_country_full_name */
SELECT standardize_country_full_name('US') AS CountryName FROM Dual

/* Synthetic Stored Procedure - apply_discount */
CALL apply_discount(
    transaction_type='SalesOrd', 
    threshold_amount=500,
    update_records=true,
    show_output=true
)