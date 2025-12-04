// Migración para Procedural Parts - Script de MongoDB
// Este script migra procedural-parts usando el mapeo internalCode -> ObjectId

require('dotenv').config();
const fs = require('fs');
const { parse } = require('csv-parse');
const mongoose = require('mongoose');
const { getRecordObjectIdByInternalCode } = require('./migration-records');

const MONGO_URI = process.env.MONGODB_CNN;

async function migrateProceduralParts(csvPath) {
    let connection;
    try {
        console.log('🔌 Conectando a MongoDB...');
        connection = await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado a MongoDB');

        const proceduralPartsCollection = mongoose.connection.db.collection('proceduralparts');
        const mappingCollection = mongoose.connection.db.collection('migration_mappings');

        // Limpiar colección si existe
        console.log('🧹 Limpiando colección procedural parts...');
        await proceduralPartsCollection.deleteMany({});

        // Cargar todo el mapeo en memoria para optimizar
        console.log('📋 Cargando mapeo de internalCode a ObjectId...');
        const mappings = await mappingCollection.find({ type: 'internalCode_to_objectId' }).toArray();
        const mappingMap = new Map();
        mappings.forEach(mapping => {
            mappingMap.set(mapping.internalCode, mapping.recordObjectId);
        });
        console.log(`📊 Mapeo cargado: ${mappingMap.size} entradas`);

        const csvData = [];

        return new Promise((resolve, reject) => {
            fs.createReadStream(csvPath)
                .pipe(parse({
                    delimiter: ';',
                    columns: true,
                    skip_empty_lines: true,
                    quote: '"',
                    bom: true
                }))
                .on('data', (row) => {
                    csvData.push(row);
                })
                .on('end', async () => {
                    try {
                        console.log(`📊 Procesando ${csvData.length} registros...`);
                        const proceduralPartsToInsert = [];
                        let skippedCount = 0;

                        for (const row of csvData) {
                            // Debug: mostrar los primeros registros
                            if (csvData.indexOf(row) < 3) {
                                console.log('🔍 Debug row:', JSON.stringify(row, null, 2));
                            }

                            // Obtener el ObjectId del mapeo en memoria
                            const recordObjectId = mappingMap.get(row.internalCode);

                            if (!recordObjectId) {
                                console.warn(`⚠️  No se encontró record para internalCode: ${row.internalCode}`);
                                skippedCount++;
                                continue;
                            }

                            // Validar que tenga los campos requeridos
                            if (!row.partType || !row.name) {
                                console.warn(`⚠️  Datos incompletos para internalCode: ${row.internalCode}`);
                                skippedCount++;
                                continue;
                            }

                            const proceduralPart = {
                                _id: new mongoose.Types.ObjectId(),
                                record: recordObjectId,
                                partType: row.partType, // 'demandante' o 'demandada'
                                name: row.name,
                                documentType: row.documentType || '',
                                document: row.document || '',
                                email: row.email || '',
                                contact: row.contact || '',
                                createdAt: new Date(),
                                updatedAt: new Date()
                            };

                            proceduralPartsToInsert.push(proceduralPart);
                        }

                        if (proceduralPartsToInsert.length > 0) {
                            console.log('💾 Insertando procedural parts en la base de datos...');
                            const result = await proceduralPartsCollection.insertMany(proceduralPartsToInsert);
                            console.log(`✅ Insertados ${result.insertedCount} procedural parts`);
                            if (skippedCount > 0) {
                                console.log(`⚠️  Omitidos ${skippedCount} procedural parts sin record asociado o datos incompletos`);
                            }

                            console.log('🔌 Desconectando de MongoDB...');
                            await mongoose.disconnect();
                            console.log('🔌 Desconectado de MongoDB');

                            resolve(result);
                        } else {
                            console.log('⚠️  No se encontraron procedural parts válidos para insertar');

                            console.log('🔌 Desconectando de MongoDB...');
                            await mongoose.disconnect();
                            console.log('🔌 Desconectado de MongoDB');

                            resolve({ insertedCount: 0 });
                        }

                    } catch (error) {
                        console.log('🔌 Desconectando de MongoDB por error...');
                        if (mongoose.connection.readyState === 1) {
                            await mongoose.disconnect();
                        }
                        reject(error);
                    }
                })
                .on('error', (error) => {
                    console.log('🔌 Desconectando de MongoDB por error de CSV...');
                    mongoose.disconnect().then(() => reject(error)).catch(() => reject(error));
                });
        });

    } catch (error) {
        console.error('❌ Error en migración de procedural parts:', error);
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
        throw error;
    }
}

module.exports = {
    migrateProceduralParts
};

// Ejecutar si se llama directamente
if (require.main === module) {
    const csvPath = process.argv[2] || './src/scripts/procedural-parts-migrated.csv';

    migrateProceduralParts(csvPath)
        .then(() => {
            console.log('🎉 Migración de procedural parts completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error en migración:', error);
            process.exit(1);
        });
}