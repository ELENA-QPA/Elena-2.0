// Script maestro de migración - Ejecuta todas las migraciones en orden
// Ejecuta: Records -> Procedural Parts -> Performances

require('dotenv').config();
const { migrateRecords } = require('./migration-records');
const { migrateProceduralParts } = require('./migration-procedural-parts');
const { migratePerformances } = require('./migration-performances');

async function runFullMigration() {
    console.log('🚀 Iniciando migración completa de la base de datos...\n');

    try {
        // 1. Migrar Records (crea el mapeo internalCode -> ObjectId)
        console.log('📋 Paso 1: Migrando Records...');
        await migrateRecords();
        console.log('✅ Records migrados exitosamente\n');

        // 2. Migrar Procedural Parts (usa el mapeo)
        console.log('👥 Paso 2: Migrando Procedural Parts...');
        const proceduralPartsCsvPath = './src/scripts/procedural-parts-migrated.csv';
        await migrateProceduralParts(proceduralPartsCsvPath);
        console.log('✅ Procedural Parts migrados exitosamente\n');

        // 3. Migrar Performances (usa el mapeo)
        console.log('📊 Paso 3: Migrando Performances...');
        const performancesCsvPath = './src/scripts/performances-migrated.csv';
        await migratePerformances(performancesCsvPath);
        console.log('✅ Performances migrados exitosamente\n');

        console.log('🎉 ¡Migración completa finalizada exitosamente!');

    } catch (error) {
        console.error('💥 Error durante la migración:', error);
        process.exit(1);
    }
}

// Función para verificar archivos CSV antes de la migración
function checkCsvFiles() {
    const fs = require('fs');
    const files = [
        './src/scripts/records-migrated.csv',
        './src/scripts/procedural-parts-migrated.csv',
        './src/scripts/performances-migrated.csv'
    ];

    console.log('🔍 Verificando archivos CSV...');

    for (const file of files) {
        if (!fs.existsSync(file)) {
            console.error(`❌ Archivo no encontrado: ${file}`);
            return false;
        }
        console.log(`✅ Encontrado: ${file}`);
    }

    return true;
}

// Ejecutar migración
if (require.main === module) {
    console.log('='.repeat(60));
    console.log('         MIGRACIÓN COMPLETA QP ALLIANCE');
    console.log('='.repeat(60));

    if (checkCsvFiles()) {
        runFullMigration();
    } else {
        console.log('\n📝 Uso:');
        console.log('node src/scripts/master-migration.js');
        console.log('\nAsegúrate de que existan estos archivos:');
        console.log('- ./src/scripts/records-migrated.csv');
        console.log('- ./src/scripts/procedural-parts-migrated.csv');
        console.log('- ./src/scripts/performances-migrated.csv');
        process.exit(1);
    }
}

module.exports = {
    runFullMigration
};