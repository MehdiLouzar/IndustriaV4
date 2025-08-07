import { Pool } from 'pg';

export default async function zonesRoute(fastify) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  fastify.get('/zones', async (_request, _reply) => {
    const result = await pool.query(`
      SELECT id,
             name,
             ST_AsGeoJSON(geom)::json AS geometry
      FROM zones;
    `);
    return result.rows;
  });
}
