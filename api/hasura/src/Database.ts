import { Pool } from 'pg';
import { account, session } from './schema';

// Use parameterized query to prevent sql injection
// https://node-postgres.com/features/queries#parameterized-query
const UPSERT_ACCOUNT = `
INSERT INTO account (email)
VALUES($1)
ON CONFLICT(email) DO NOTHING
RETURNING account_id;
`.trim();

class Database {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
    });
  }

  /**
   * Accepts an email and inserts into the database irregardless if it has been created
   * @param { email }
   */
  async findOrCreateUser(email: string): Promise<account['account_id']> {
    const values = [email];

    const res = await this.pool.query(UPSERT_ACCOUNT, values);
    return res.rows[0];
  }

  async createSession(
    accountId: string,
    expiresAt: number,
    userAgent: string,
  ): Promise<session['session_id']> {
    const values = [accountId, expiresAt, userAgent];

    const res = await this.pool.query(UPSERT_ACCOUNT, values);
    return res.rows[0];
  }

  cleanup() {
    return this.pool.end();
  }
}

export default Database;
