// Script para transformar el archivo performances-migrated.csv
// Convierte los performanceType a los estados del enum exactos
const fs = require('fs');
const { parse } = require('csv-parse');

// Mapeo de performances originales a estados del enum
const performanceToStateMapping = {
    'Radicado': 'RADICADO',
    'Inadmitido': 'INADMITIDO',
    'Subsanación': 'SUBSANACION',
    'Admite': 'ADMITE',
    'Notificación personal de la demanda': 'NOTIFICACION_PERSONAL',
    'Contestación de demanda': 'CONTESTACION_DEMANDA',
    'Inadmite contestación': 'INADMITE_CONTESTACION',
    'Inadmite contestación de la demanda': 'INADMITE_CONTESTACION',
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
    'NA': 'INADMITIDO'
};

async function transformPerformancesCsv() {
    try {
        console.log('📖 Leyendo archivo performances-migrated.csv...');

        const inputFile = './src/scripts/performances-migrated.csv';
        const outputFile = './src/scripts/performances-migrated-transformed.csv';

        // Crear backup del archivo original
        fs.copyFileSync(inputFile, `${inputFile}.backup`);
        console.log('💾 Backup creado');

        const transformedData = [];
        let processedCount = 0;
        let unmappedCount = 0;
        const unmappedPerformances = new Set();

        return new Promise((resolve, reject) => {
            fs.createReadStream(inputFile)
                .pipe(parse({
                    delimiter: ';',
                    columns: true,
                    skip_empty_lines: true,
                    bom: true,
                    quote: '"'
                }))
                .on('data', (row) => {
                    processedCount++;

                    // Transformar el performanceType
                    const originalPerformance = row.performanceType;
                    const mappedPerformance = performanceToStateMapping[originalPerformance];

                    if (mappedPerformance) {
                        row.performanceType = mappedPerformance;
                        console.log(`✅ ${originalPerformance} → ${mappedPerformance}`);
                    } else {
                        unmappedCount++;
                        unmappedPerformances.add(originalPerformance);
                        console.log(`⚠️  No mapeado: "${originalPerformance}"`);
                    }

                    transformedData.push(row);
                })
                .on('end', async () => {
                    try {
                        console.log(`\n📊 Procesadas ${processedCount} filas`);
                        console.log(`⚠️  ${unmappedCount} performances no mapeadas`);

                        if (unmappedPerformances.size > 0) {
                            console.log('\n🔍 Performances no mapeadas:');
                            unmappedPerformances.forEach(perf => {
                                console.log(`   - "${perf}"`);
                            });
                        }

                        // Escribir archivo transformado usando CSV manual
                        const headers = Object.keys(transformedData[0]);
                        let csvContent = headers.join(';') + '\n';

                        transformedData.forEach(row => {
                            const values = headers.map(header => row[header] || '');
                            csvContent += values.join(';') + '\n';
                        });

                        fs.writeFileSync(outputFile, csvContent, 'utf8');
                        console.log(`\n✅ Archivo transformado guardado: ${outputFile}`);

                        // Reemplazar el archivo original con el transformado
                        fs.renameSync(outputFile, inputFile);
                        console.log('✅ Archivo original reemplazado');

                        resolve({
                            processed: processedCount,
                            unmapped: unmappedCount,
                            unmappedPerformances: Array.from(unmappedPerformances)
                        });

                    } catch (error) {
                        reject(error);
                    }
                })
                .on('error', reject);
        });

    } catch (error) {
        console.error('❌ Error transformando archivo:', error);
        throw error;
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    transformPerformancesCsv()
        .then((result) => {
            console.log('\n🎉 Transformación completada');
            console.log(`📊 Resumen: ${result.processed} procesadas, ${result.unmapped} no mapeadas`);
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error en transformación:', error);
            process.exit(1);
        });
}

module.exports = {
    transformPerformancesCsv
};