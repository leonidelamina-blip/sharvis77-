const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const express = require('express')
const pino = require('pino')

const app = express()
app.get('/', (req,res) => res.send('Sharvis77 online! Use pairing code'))
app.listen(3000, () => console.log('Servidor web on'))

const PHONE_NUMBER = "258872698781"

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Sharvis77','Chrome','1.0']
  })

  sock.ev.on('creds.update', saveCreds)

  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(PHONE_NUMBER)
        console.log("==================================")
        console.log(`TEU CODIGO DE PAREAMENTO: ${code}`)
        console.log("==================================")
      } catch(e) { console.log("Erro ao gerar codigo:", e) }
    }, 3000)
  }

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update
    if(connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut
      if(shouldReconnect) startBot()
    } else if(connection === 'open') {
      console.log('✅ Sharvis77 Conectado via CODIGO!')
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if(!m.message || m.key.fromMe) return
    const texto = m.message.conversation || m.message.extendedTextMessage?.text || ''
    const from = m.key.remoteJid
    if(texto.toLowerCase() === 'menu' || texto.toLowerCase() === '.menu') {
      await sock.sendMessage(from, { text: `*SHARVIS77 - BOT ONLINE* 🤖\n\n*COMANDOS:*\n.menu - este menu\n.ping - velocidade\n.dono - meu dono\n.oi - saudacao\n\n*Bot 24h no ar!*` })
    }
    if(texto.toLowerCase() === '.ping') {
      await sock.sendMessage(from, { text: 'Pong! ⚡ 45ms' })
    }
    if(texto.toLowerCase() === '.dono') {
      await sock.sendMessage(from, { text: 'Dono: 258872698781 🚀' })
    }
  })
}
startBot()
