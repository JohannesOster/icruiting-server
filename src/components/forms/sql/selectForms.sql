SELECT form.*, json_agg(items.* ORDER BY row_index ASC) form_fields
FROM form
JOIN (SELECT * FROM form_field) as items 
ON items.form_id = form.form_id
WHERE form.organization_id = ${organization_id}
GROUP BY form.form_id;