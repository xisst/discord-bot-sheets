const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const fetch = require('node-fetch');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Bot Status: Online! 🟢'));
app.listen(process.env.PORT || 3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const commands = [{
  name: 'register',
  description: 'ลงทะเบียนหรืออัปเดตข้อมูลสมาชิกกิลด์',
  options: [
    { type: 3, name: 'name', description: 'ชื่อในเกมของคุณ', required: true },
    { type: 3, name: 'job', description: 'อาชีพปัจจุบันของคุณ', required: true },
    { type: 3, name: 'nickname', description: 'ชื่อเล่นของคุณ', required: false }
  ]
}];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  try {
    await rest.put(Routes.applicationCommands(process.env.APPLICATION_ID), { body: commands });
    console.log('Successfully registered application commands.');
  } catch (error) {
    console.error(error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'register') {
    await interaction.deferReply();

    const name = interaction.options.getString('name');
    const job = interaction.options.getString('job');
    const nickname = interaction.options.getString('nickname') || '-';
    const discordId = interaction.user.id;

    try {
      const response = await fetch(process.env.WEBAPP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordId, name, job, nickname })
      });
      const result = await response.text();

      if (result === 'Updated') {
        await interaction.editReply(`🔄 อัปเดตข้อมูลกิลด์เรียบร้อย! \nชื่อในเกม: **${name}** \nอาชีพ: **${job}**`);
      } else {
        await interaction.editReply(`✅ ลงทะเบียนสมาชิกใหม่สำเร็จ! \nชื่อในเกม: **${name}** \nอาชีพ: **${job}**`);
      }
    } catch (error) {
      await interaction.editReply('❌ เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google Sheets');
      console.error(error);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
