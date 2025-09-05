SELECT 	id, tranid, foreignTotal, status, custbody_ava_discountamount
FROM	Transaction
WHERE	type = 'SalesOrd'
AND		tranid = 'SO15371'

SELECT standardize_country_full_name('US') AS CountryName FROM Dual

CALL apply_discount(
    transaction_type='SalesOrd', 
    threshold_amount=500,
    update_records=true,
    show_output=true
)