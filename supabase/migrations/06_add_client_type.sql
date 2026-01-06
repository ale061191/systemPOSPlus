-- Add client_type column to customers table
alter table customers 
add column if not exists client_type text default 'Externo';

comment on column customers.client_type is 'Type of customer: Profesor, Estudiante, Trabajador, Externo';
