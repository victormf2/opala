export type MySqlTable = {
  name: string;
  columns: MySqlColumn[];
  primaryKey: string[];
  foreignKeys: MySqlForeignKey[];
};

type MySqlForeignKey = {
  table: MySqlTable;
  references: string[];
};

type BaseMySqlColumn = {
  name: string;
  nullable: boolean;
};
export type NumericMySqlColumn = BaseMySqlColumn & {
  is: 'numeric';
  type: MySqlNumericType;
  signed: boolean;
};
export type StringMySqlColumn = BaseMySqlColumn & {
  is: 'string';
  type: MySqlStringType;
};
export type MySqlColumn = NumericMySqlColumn | StringMySqlColumn;

export type MySqlColumnType =
  | MySqlNumericType
  | MySqlStringType
  | MySqlDateTimeType
  | MySqlBitType
  | MySqlSpacialType
  | MySqlJsonType;

export type MySqlNumericType =
  | 'TINYINT'
  | 'SMALLINT'
  | 'MEDIUMINT'
  | 'INT'
  | 'BIGINT'
  | 'FLOAT'
  | 'DOUBLE'
  | 'REAL'
  | 'DECIMAL'
  | 'BOOLEAN';

export type MySqlStringType =
  | 'CHAR'
  | 'VARCHAR'
  | 'TINYTEXT'
  | 'TEXT'
  | 'MEDIUMTEXT'
  | 'LONGTEXT'
  | 'BINARY'
  | 'VARBINARY'
  | 'TINYBLOB'
  | 'BLOB'
  | 'MEDIUMBLOB'
  | 'LONGBLOB'
  | 'ENUM'
  | 'SET';

export type MySqlDateTimeType =
  | 'DATE'
  | 'TIME'
  | 'DATETIME'
  | 'TIMESTAMP'
  | 'YEAR';

export type MySqlBitType = 'BIT';

export type MySqlSpacialType =
  | 'GEOMETRY'
  | 'POINT'
  | 'LINESTRING'
  | 'POLYGON'
  | 'GEOMETRYCOLLECTION'
  | 'MULTIPOINT'
  | 'MULTILINESTRING'
  | 'MULTIPOLYGON';

export type MySqlJsonType = 'JSON' | 'JSONB';
