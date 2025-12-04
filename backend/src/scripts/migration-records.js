// Migración para Records - Script de MongoDB
// Este script importa los records y crea un mapeo de internalCode -> ObjectId

require('dotenv').config();
const fs = require('fs');
const { parse } = require('csv-parse');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_CNN;

// Mapeo para almacenar internalCode -> ObjectId
const internalCodeToObjectId = new Map();

async function migrateRecords() {
    try {
        console.log('🔌 Conectando a MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado a MongoDB');

        const recordsCollection = mongoose.connection.db.collection('records');

        // Limpiar colección si existe
        await recordsCollection.deleteMany({});
        console.log('🧹 Colección records limpiada');

        // Leer CSV
        const csvData = [];
        const csvPath = './src/scripts/records-migrated.csv';

        return new Promise((resolve, reject) => {
            fs.createReadStream(csvPath, { encoding: 'utf8' })
                .pipe(parse({
                    delimiter: ';',
                    columns: true,
                    skip_empty_lines: true,
                    quote: '"',
                    bom: true // Manejar BOM UTF-8
                }))
                .on('data', (row) => {
                    csvData.push(row);
                })
                .on('end', async () => {
                    try {
                        console.log(`📊 Procesando ${csvData.length} registros...`);
                        const recordsToInsert = [];

                        for (const row of csvData) {
                            const recordId = new mongoose.Types.ObjectId();

                            // Crear mapeo internalCode -> ObjectId
                            internalCodeToObjectId.set(row.internalCode, recordId);
                            console.log(`🔗 Mapeo creado: ${row.internalCode} -> ${recordId}`);

                            const record = {
                                _id: recordId,
                                user: new mongoose.Types.ObjectId(row.user),
                                clientType: row.clientType,
                                internalCode: row.internalCode,
                                department: row.department,
                                personType: row.personType,
                                jurisdiction: row.jurisdiction,
                                location: row.city,
                                processType: row.processType,
                                office: row.office,
                                settled: row.settled,
                                city: row.city,
                                country: 'Colombia',
                                createdAt: new Date(),
                                updatedAt: new Date()
                            };

                            recordsToInsert.push(record);
                        }

                        console.log('💾 Insertando records en la base de datos...');
                        // Verificar que la conexión sigue activa
                        if (mongoose.connection.readyState !== 1) {
                            throw new Error('Conexión a MongoDB perdida');
                        }

                        // Insertar todos los records
                        const result = await recordsCollection.insertMany(recordsToInsert);
                        console.log(`✅ Insertados ${result.insertedCount} records`);

                        // Guardar mapeo para usar en otras migraciones
                        console.log(`📋 Tamaño del mapeo antes de guardar: ${internalCodeToObjectId.size}`);
                        await saveMapping(mongoose.connection.db, internalCodeToObjectId);

                        // Desconectar después de completar todo exitosamente
                        await mongoose.disconnect();
                        console.log('🔌 Desconectado de MongoDB');

                        resolve(result);
                    } catch (error) {
                        // Desconectar en caso de error
                        if (mongoose.connection.readyState === 1) {
                            await mongoose.disconnect();
                        }
                        reject(error);
                    }
                })
                .on('error', async (error) => {
                    // Desconectar en caso de error de parsing
                    if (mongoose.connection.readyState === 1) {
                        await mongoose.disconnect();
                    }
                    reject(error);
                });
        });

    } catch (error) {
        console.error('❌ Error en migración de records:', error);
        // Desconectar en caso de error inicial
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
        throw error;
    }
}

async function saveMapping(db, mapping) {
    const mappingCollection = db.collection('migration_mappings');

    // Limpiar mapeos anteriores
    await mappingCollection.deleteMany({ type: 'internalCode_to_objectId' });

    // Convertir Map a array para guardar
    const mappingArray = Array.from(mapping.entries()).map(([internalCode, objectId]) => ({
        type: 'internalCode_to_objectId',
        internalCode,
        recordObjectId: objectId,
        createdAt: new Date()
    }));

    await mappingCollection.insertMany(mappingArray);
    console.log(`✅ Guardado mapeo de ${mappingArray.length} internalCodes`);
}

// Función para obtener ObjectId por internalCode (para usar en otras migraciones)
async function getRecordObjectIdByInternalCode(internalCode) {
    try {
        if (!mongoose.connection.readyState) {
            await mongoose.connect(process.env.MONGODB_CNN);
        }
        const mappingCollection = mongoose.connection.db.collection('migration_mappings'); const mapping = await mappingCollection.findOne({
            type: 'internalCode_to_objectId',
            internalCode: internalCode
        });

        return mapping ? mapping.recordObjectId : null;
    } catch (error) {
        console.error('Error obteniendo ObjectId:', error);
        return null;
    }
} module.exports = {
    migrateRecords,
    getRecordObjectIdByInternalCode
};

// Ejecutar si se llama directamente
if (require.main === module) {
    migrateRecords()
        .then(() => {
            console.log('🎉 Migración de records completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error en migración:', error);
            process.exit(1);
        });
}