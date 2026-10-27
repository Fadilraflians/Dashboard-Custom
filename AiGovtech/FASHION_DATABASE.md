# Fashion dataset on local Oracle

The AIGovtech API reads fashion data from Oracle using the read-only
`FASHION_CHAT` account. The table owner is `FASHION_APP`; keep its credentials
separate from the chatbot account. The chatbot adds summary context from
`FASHION_APP.FASHION_SALES` to each model request. Direct order lookups are
limited to 20 detail rows and use a bind variable.

## Local database

- Docker container: `oracle-db`
- Host connection: `localhost:1522/DASHBOARDDB`
- Table: `FASHION_APP.FASHION_SALES`
- CSV source: `dummydataexcel_fashion_2025_3.csv`

The import expects the header and the 21 CSV columns shown in
`fashion_sales.ctl`. `fashion_schema.sql` creates the table and indexes.

## API configuration

Copy `.env.example` to `.env`, set the locally generated `FASHION_CHAT`
password, and restart `pnpm dev` so the API loads the connection settings.
`.env` is ignored by Git. The API connects with a small Oracle connection pool;
it does not use the privileged `SYSTEM` account.
