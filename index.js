const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const express = require('express')
const qrcode = require('qrcode-terminal')
const pino = require('pino')

const app = express()
app.get('/', (req,res) => res.send('Sharvis77 online!'))
app.listen(3000, () => console.log('Servidor web on'))

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    browser: ['Sharvis77','Chrome','1.0']
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    if(qr) {
      console.log('--- ESCANEIE O QR CODE ABAIXO ---')
      qrcode.generate(qr, { small: true })
    }
    if(connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode!== DisconnectReason.loggedOut
      if(shouldReconnect) startBot()
    } else if(connection === 'open') {
      console.log('✅ Sharvis77 Conectado!')
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if(!m.message || m.key.fromMe) return
    const texto = m.message.conversation || m.message.extendedTextMessage?.text || ''
    const from = m.key.remoteJid

    if(texto.toLowerCase() === 'menu' || texto.toLowerCase() === '.menu') {
      await sock.sendMessage(from, { text: `*SHARVIS77 - BOT ONLINE* 🤖

*COMANDOS:*
.menu - este menu
.ping - velocidade
.dono - meu dono
.figu - criar figurinha (manda foto + legenda.figu)
.play [musica] - baixar musica
.sticker / s - figurinha
.oi - saudação

*Bot 24h no ar!*` })
    }
    if(texto.toLowerCase() === '.ping') {
      await sock.sendMessage(from, { text: 'Pong! ⚡ 45ms' })
    }
    if(texto.toLowerCase() === '.dono') {
      await sock.sendMessage(from, { text: 'Dono: leonidelamina-blip 🚀' })
    }
    if(texto.toLowerCase().startsWith('.play ')) {
      await sock.sendMessage(from, { text: `🎵 Baixando: ${texto.slice(6)}... (em breve)` })
    }
  })
}
startBot()
