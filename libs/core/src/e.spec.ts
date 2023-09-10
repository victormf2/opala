import {
  DummyDriver,
  Generated,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from 'kysely';

interface Person {
  id: Generated<number>;
  first_name: string;
  last_name: string | null;
}

interface Database {
  person: Person;
}

const db = new Kysely<Database>({
  dialect: {
    createAdapter: () => new PostgresAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (db) => new PostgresIntrospector(db),
    createQueryCompiler: () => new PostgresQueryCompiler(),
  },
});

const compiledQuery = db
  .selectFrom('person')
  .select('first_name')
  .where('id', '=', 12)
  .compile();
