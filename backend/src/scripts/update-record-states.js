// Script para actualizar estado y tipoEstado de records basándose en la última performance
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_CNN;

// Mapeo de performances a estados del enum
const performanceToStateMapping = {
    'Radicado': 'RADICADO',
    'Inadmitido': 'INADMITIDO',
    'Subsanación': 'SUBSANACION',
    'Admite': 'ADMITE',
    'Notificación personal de la demanda': 'NOTIFICACION_PERSONAL',
    'Contestación de demanda': 'CONTESTACION_DEMANDA',
    'Inadmite contestación': 'INADMITE_CONTESTACION',
    'Admisión contestación': 'ADMISION_CONTESTACION',
    'Fija audiencia': 'FIJA_AUDIENCIA',
    'Celebra audiencia': 'CELEBRA_AUDIENCIA',
    'Conciliado': 'CONCILIADO',
    'Archivado': 'ARCHIVADO',
    'Retiro de demanda': 'RETIRO_DEMANDA',
    'Finalizado por sentencia': 'FINALIZADO_SENTENCIA',
    'Finalizado por rechazo': 'FINALIZADO_RECHAZO',
    'Finalizado por Rechazo': 'FINALIZADO_RECHAZO',
    'Radica impulso procesal': 'RADICA_IMPULSO_PROCESAL',
    'Inadmite contestación de la demanda': 'INADMITE_CONTESTACION',
    'NA': 'INADMITIDO'
};

// Mapeo de estados a tipo de estado
const stateTypeMapping = {
    'RADICADO': 'ACTIVO',
    'INADMITIDO': 'ACTIVO',
    'SUBSANACION': 'ACTIVO',
    'ADMITE': 'ACTIVO',
    'NOTIFICACION_PERSONAL': 'ACTIVO',
    'CONTESTACION_DEMANDA': 'ACTIVO',
    'INADMITE_CONTESTACION': 'ACTIVO',
    'ADMISION_CONTESTACION': 'ACTIVO',
    'FIJA_AUDIENCIA': 'ACTIVO',
    'CELEBRA_AUDIENCIA': 'ACTIVO',
    'CONCILIADO': 'FINALIZADO',
    'ARCHIVADO': 'FINALIZADO',
    'RETIRO_DEMANDA': 'FINALIZADO',
    'FINALIZADO_SENTENCIA': 'FINALIZADO',
    'FINALIZADO_RECHAZO': 'FINALIZADO',
    'RADICA_IMPULSO_PROCESAL': 'ACTIVO'
};

async function updateRecordStates() {
    try {
        console.log('🔌 Conectando a MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado a MongoDB');

        // Obtener referencias a las colecciones
        const recordsCollection = mongoose.connection.db.collection('records');
        const performancesCollection = mongoose.connection.db.collection('performances');

        console.log('📊 Procesando records y sus performances...');

        // Obtener todos los records
        const records = await recordsCollection.find({ deletedAt: { $exists: false } }).toArray();
        console.log(`📋 Encontrados ${records.length} records`);

        let updatedCount = 0;
        let recordsWithoutPerformances = 0;
        let unmappedPerformances = [];

        for (const record of records) {
            // Buscar la última performance para este record
            const latestPerformance = await performancesCollection
                .findOne(
                    { record: record._id },
                    { sort: { createdAt: -1 } }
                );

            if (!latestPerformance) {
                recordsWithoutPerformances++;
                console.log(`⚠️  Record ${record.internalCode} no tiene performances`);
                continue;
            }

            // Mapear el performanceType al estado del enum
            const mappedState = performanceToStateMapping[latestPerformance.performanceType];

            if (!mappedState) {
                unmappedPerformances.push({
                    recordId: record.internalCode,
                    performanceType: latestPerformance.performanceType
                });
                console.log(`⚠️  Performance no mapeada: "${latestPerformance.performanceType}" para record ${record.internalCode}`);
                continue;
            }

            // Obtener el tipo de estado
            const tipoEstado = stateTypeMapping[mappedState];

            // Actualizar el record con el nuevo estado y tipoEstado
            const updateResult = await recordsCollection.updateOne(
                { _id: record._id },
                {
                    $set: {
                        estado: mappedState,
                        tipoEstado: tipoEstado,
                        updatedAt: latestPerformance.createdAt
                    }
                }
            );

            if (updateResult.modifiedCount > 0) {
                updatedCount++;
                console.log(`✅ Record ${record.internalCode}: ${mappedState} (${tipoEstado})`);
            }

            if (updatedCount % 100 === 0) {
                console.log(`📈 Procesados ${updatedCount} records...`);
            }
        }

        console.log('\n📊 Resumen de la actualización:');
        console.log(`✅ Records actualizados: ${updatedCount}`);
        console.log(`⚠️  Records sin performances: ${recordsWithoutPerformances}`);
        console.log(`⚠️  Performances no mapeadas: ${unmappedPerformances.length}`);

        if (unmappedPerformances.length > 0) {
            console.log('\n🔍 Performances no mapeadas encontradas:');
            const uniquePerformances = [...new Set(unmappedPerformances.map(p => p.performanceType))];
            uniquePerformances.forEach(perf => {
                console.log(`   - "${perf}"`);
            });

            console.log('\n💡 Agrega estos mapeos al objeto performanceToStateMapping si son válidos.');
        }

    } catch (error) {
        console.error('❌ Error durante la actualización:', error);
        throw error;
    } finally {
        console.log('🔌 Desconectando de MongoDB...');
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB');
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    updateRecordStates()
        .then(() => {
            console.log('🎉 Actualización de estados completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error en actualización:', error);
            process.exit(1);
        });
}

module.exports = {
    updateRecordStates
};