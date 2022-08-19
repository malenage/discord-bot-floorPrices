import 'dotenv/config';
import { Client, EmbedBuilder, TextChannel, GatewayIntentBits } from 'discord.js';
import axios from 'axios';
import { CronJob } from 'cron';
// import moment from 'moment';

const client = new Client({intents: [GatewayIntentBits.Guilds]});

const job = new CronJob({
    cronTime: process.env.CRONTIME,
    onTick: runCron,
    start: false,
    timeZone: 'Europe/Paris',
  });

client.on('ready', async () => {
    console.log('floorPrice bot ready');
    job.start();
});

async function runCron() {
    // retrieve collections to monitor
    const collections = (process.env.COLLECTIONS_ARRAY!).split(',');
    let channel = client.channels.cache.get(process.env.CHANNEL_ID!) as TextChannel;
    let embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`Current Floor Prices`)
    let promises : Promise<any>[] = [];    
    for (let collection of collections) {
        promises.push(new Promise<void>(async(resolve, reject) => {
            const url = process.env.ME_URL + collection + process.env.ME_URL2;
            const stats = await axios.get(url!);
            embed.addFields(
                    { name: `${stats.data.symbol}`,
                    value: `Floor: ${stats.data.floorPrice / 1000000000},
                    Listed: ${stats.data.listedCount},
                    Avg 24h price: ${stats.data.avgPrice24hr / 1000000000}` },
                )
            resolve();
        }));
    }
    Promise.all(promises).then(() => {
        channel.send({ embeds: [embed] });
    });
};

(async () => {
    try {
        // connect to ME's API every 5 minutes to check activity on collection
        await client.login(process.env.TOKEN);
    } catch(err) {
        console.log(err);
    }
})();
