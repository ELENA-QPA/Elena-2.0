// Migración para Performances - Script de MongoDB
// Este script migra performances usando el mapeo internalCode -> ObjectId

require('dotenv').config();
const fs = require('fs');
const { parse } = require('csv-parse');
const mongoose = require('mongoose');
const { getRecordObjectIdByInternalCode } = require('./migration-records');

const MONGO_URI = process.env.MONGODB_CNN;

// Función para convertir fecha DD/MM/YY a Date
function parseDate(dateString) {
    if (!dateString || dateString.trim() === '') return new Date();

    try {
        const parts = dateString.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // JS months are 0-indexed
            let year = parseInt(parts[2]);

            // Convertir año de 2 dígitos a 4 dígitos
            if (year < 50) {
                year += 2000;
            } else if (year < 100) {
                year += 1900;
            }

            return new Date(year, month, day);
        }
    } catch (error) {
        console.warn(`⚠️  Error parseando fecha: ${dateString}, usando fecha actual`);
    }

    return new Date();
}

async function migratePerformances(csvPath) {
    let connection;
    try {
        console.log('🔌 Conectando a MongoDB...');
        connection = await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado a MongoDB');

        const performancesCollection = mongoose.connection.db.collection('performances');
        const mappingCollection = mongoose.connection.db.collection('migration_mappings');

        // Limpiar colección si existe
        console.log('🧹 Limpiando colección performances...');
        await performancesCollection.deleteMany({});

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
                    bom: true // Manejar BOM UTF-8
                }))
                .on('data', (row) => {
                    csvData.push(row);
                })
                .on('end', async () => {
                    try {
                        console.log(`📊 Procesando ${csvData.length} registros...`);
                        const performancesToInsert = [];
                        let skippedCount = 0;
                        const skippedRows = [];

                        for (const row of csvData) {
                            // Obtener el ObjectId del mapeo en memoria
                            const recordObjectId = mappingMap.get(row.internalCode);

                            if (!recordObjectId) {
                                console.warn(`⚠️  No se encontró record para internalCode: "${row.internalCode}"`);
                                skippedRows.push({
                                    internalCode: row.internalCode,
                                    performanceType: row.performanceType,
                                    responsible: row.responsible,
                                    createdAt: row.createdAt
                                });
                                skippedCount++;
                                continue;
                            }

                            const performance = {
                                _id: new mongoose.Types.ObjectId(),
                                record: recordObjectId,
                                performanceType: row.performanceType || '',
                                responsible: row.responsible || '',
                                observation: '', // Campo vacío por defecto si no está en CSV
                                createdAt: parseDate(row.createdAt),
                                updatedAt: new Date()
                            };

                            performancesToInsert.push(performance);
                        }

                        if (performancesToInsert.length > 0) {
                            console.log('💾 Insertando performances en la base de datos...');
                            const result = await performancesCollection.insertMany(performancesToInsert);
                            console.log(`✅ Insertados ${result.insertedCount} performances`);
                            if (skippedCount > 0) {
                                console.log(`⚠️  Omitidos ${skippedCount} performances sin record asociado:`);
                                skippedRows.forEach((row, index) => {
                                    console.log(`   ${index + 1}. internalCode: "${row.internalCode}", performanceType: "${row.performanceType}", responsible: "${row.responsible}"`);
                                });
                            }

                            console.log('🔌 Desconectando de MongoDB...');
                            await mongoose.disconnect();
                            console.log('🔌 Desconectado de MongoDB');

                            resolve(result);
                        } else {
                            console.log('⚠️  No se encontraron performances válidos para insertar');

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
        console.error('❌ Error en migración de performances:', error);
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
        throw error;
    }
}

module.exports = {
    migratePerformances
};

// Ejecutar si se llama directamente
if (require.main === module) {
    const csvPath = process.argv[2] || './src/scripts/performances-migrated.csv';

    migratePerformances(csvPath)
        .then(() => {
            console.log('🎉 Migración de performances completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error en migración:', error);
            process.exit(1);
        });
}