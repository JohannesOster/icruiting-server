SELECT form.*, json_agg(items) form_items
FROM form
JOIN (SELECT * FROM form_item) as items 
ON items.form_id = form.form_id
WHERE form.organization_id = ${organization_id}
GROUP BY form.form_id;