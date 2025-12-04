// Script para actualizar internalCodes con el formato correcto: inicial del clientType + número con 3 cifras
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_CNN;

// Mapeo de clientType a inicial
const clientTypeToInitial = {
    'Rappi': 'R',
    'Uber': 'U',
    'Didi': 'D',
    'Otro': 'O'
};

async function updateInternalCodes() {
    try {
        console.log('🔌 Conectando a MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado a MongoDB');

        // Obtener referencia a la colección
        const recordsCollection = mongoose.connection.db.collection('records');

        console.log('📊 Procesando records para actualizar internalCodes...');

        // Obtener todos los records ordenados por internalCode numérico
        const records = await recordsCollection.find({
            deletedAt: { $exists: false }
        }).sort({ internalCode: 1 }).toArray();

        console.log(`📋 Encontrados ${records.length} records`);

        let updatedCount = 0;
        let clientTypeCounters = {};

        for (const record of records) {
            const clientType = record.clientType;
            const initial = clientTypeToInitial[clientType];

            if (!initial) {
                console.log(`⚠️  ClientType no reconocido: ${clientType} para record ${record.internalCode}`);
                continue;
            }

            // Inicializar contador para este clientType si no existe
            if (!clientTypeCounters[clientType]) {
                clientTypeCounters[clientType] = 1;
            }

            // Generar el nuevo internalCode
            const newInternalCode = `${initial}${clientTypeCounters[clientType].toString().padStart(3, '0')}`;

            // Incrementar el contador para el próximo record de este clientType
            clientTypeCounters[clientType]++;

            // Actualizar el record solo si el internalCode cambió
            if (record.internalCode !== newInternalCode) {
                const updateResult = await recordsCollection.updateOne(
                    { _id: record._id },
                    {
                        $set: {
                            internalCode: newInternalCode,
                            updatedAt: new Date()
                        }
                    }
                );

                if (updateResult.modifiedCount > 0) {
                    updatedCount++;
                    console.log(`✅ Record actualizado: ${record.internalCode} → ${newInternalCode}`);
                }
            } else {
                console.log(`⏭️  Record ya tiene el formato correcto: ${record.internalCode}`);
            }

            if (updatedCount % 50 === 0 && updatedCount > 0) {
                console.log(`📈 Procesados ${updatedCount} records...`);
            }
        }

        console.log('\n📊 Resumen de la actualización:');
        console.log(`✅ Records actualizados: ${updatedCount}`);
        console.log('📋 Contadores finales por clientType:');
        Object.keys(clientTypeCounters).forEach(clientType => {
            console.log(`   - ${clientType}: ${clientTypeCounters[clientType] - 1} records`);
        });

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
    updateInternalCodes()
        .then(() => {
            console.log('🎉 Actualización de internalCodes completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error en actualización:', error);
            process.exit(1);
        });
}

module.exports = {
    updateInternalCodes
};