#!/bin/bash
# Script de configuración inicial para MedicApp
# Ejecutar UNA VEZ antes del primer deploy

echo "🔑 Generando claves VAPID para notificaciones push..."

cd "$(dirname "$0")"
npm install --silent

node -e "
const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();
console.log('\n✅ VAPID Keys generadas:');
console.log('\nVAPIID_PUBLIC_KEY=' + keys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + keys.privateKey);
console.log('\n📋 Copiá estas variables a Railway:');
console.log('   Railway Dashboard → tu proyecto → Variables → Add Variable');
console.log('\nTambién agregá:');
console.log('   VAPID_EMAIL=mailto:tu@email.com');
console.log('   PORT=3001 (Railway lo setea automáticamente)');
"
