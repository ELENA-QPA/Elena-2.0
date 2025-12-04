// Script para verificar el estado de la migración
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_CNN;

async function checkMigrationStatus() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    console.log('✅ Conexión exitosa a MongoDB');
    console.log('📊 Base de datos:', db.databaseName);
    console.log('='.repeat(60));

    // 1. Verificar colecciones existentes
    console.log('📋 Colecciones disponibles:');
    const collections = await db.listCollections().toArray();
    collections.forEach((col) => console.log(`  - ${col.name}`));
    console.log('');

    // 2. Verificar records
    const recordsCollection = db.collection('records');
    const recordsCount = await recordsCollection.countDocuments();
    console.log(`📄 Records en la base de datos: ${recordsCount}`);

    if (recordsCount > 0) {
      console.log('📋 Primeros 3 records:');
      const sampleRecords = await recordsCollection.find({}).limit(3).toArray();
      sampleRecords.forEach((record, index) => {
        console.log(`  ${index + 1}. ID: ${record._id}`);
        console.log(`     Internal Code: ${record.internalCode}`);
        console.log(`     Client Type: ${record.clientType}`);
        console.log(`     Process Type: ${record.processType}`);
        console.log('');
      });
    }

    // 3. Verificar mapeos de migración
    const mappingCollection = db.collection('migration_mappings');
    const mappingCount = await mappingCollection.countDocuments({
      type: 'internalCode_to_objectId',
    });
    console.log(`🗺️  Mapeos de migración encontrados: ${mappingCount}`);

    if (mappingCount > 0) {
      console.log('🔗 Primeros 5 mapeos:');
      const sampleMappings = await mappingCollection
        .find({ type: 'internalCode_to_objectId' })
        .limit(5)
        .toArray();
      sampleMappings.forEach((mapping, index) => {
        console.log(
          `  ${index + 1}. ${mapping.internalCode} → ${mapping.recordObjectId}`,
        );
      });
      console.log('');
    }

    // 4. Verificar otras colecciones relacionadas
    const proceduralPartsCount = await db
      .collection('proceduralparts')
      .countDocuments();
    const performancesCount = await db
      .collection('performances')
      .countDocuments();

    console.log(`👥 Procedural Parts: ${proceduralPartsCount}`);
    console.log(`📊 Performances: ${performancesCount}`);
    console.log('');

    // 5. Verificar integridad de las relaciones
    if (recordsCount > 0 && proceduralPartsCount > 0) {
      console.log('🔍 Verificando integridad de relaciones...');
      const proceduralPartsWithRecords = await db
        .collection('proceduralparts')
        .aggregate([
          {
            $lookup: {
              from: 'records',
              localField: 'record',
              foreignField: '_id',
              as: 'recordData',
            },
          },
          {
            $match: {
              recordData: { $ne: [] },
            },
          },
        ])
        .toArray();

      console.log(
        `✅ Procedural Parts con relaciones válidas: ${proceduralPartsWithRecords.length}/${proceduralPartsCount}`,
      );
    }

    console.log('='.repeat(60));
    console.log('✅ Verificación completa');
  } catch (error) {
    console.error('❌ Error verificando el estado de la migración:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar verificación
if (require.main === module) {
  checkMigrationStatus()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error:', error);
      process.exit(1);
    });
}

module.exports = { checkMigrationStatus };
