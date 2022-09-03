# memmattersync
A Node script that allows you to easily sync [Matter](https://hq.getmatter.app/) highlights to (mem.ai)[https://get.mem.ai/]. 
Based on your reading list on Matter, the script will fetch the highlights of the fully read articles. 
In a next step, it will create a mem for each article containing some metadata information and all of your highlights.

**Remark**: Only fully read articles are synced to mem. 
This is because of the current version of the mem library does not yet support updating existing mems. 
In order to prevent duplicate entries in mem, only the articles that have a 100% reading completion will be synced.

## Prerequisites
* As this is Node script, it is important to have your [NodeJS](https://nodejs.org/en/download/) environment set up.
* You will also need an account on both [Matter](https://hq.getmatter.app/) and (mem.ai)[https://get.mem.ai/]
* In order to sync your articles from Matter you will need the Matter mobile app. This will allow you to grant access based on scanning a QR code.

### Creating an API key for mem.ai
The last thing you'll need is an API key from mem. 
This is required for the script to be able to create mem in your account. 
Execute the following steps to retrieve an API key:
1. Go [https://mem.ai/](https://mem.ai/) and login with your account
2. In the sidebar, select **Flows**  to open an overview of all the supported flows within mem.
3. Search for the **API** tile and click the **Configure** button
4. Click the **Create API key** button and create a new key. Make sure to **copy the key** as you'll need this in the next step
5. Create a new file called **apikey.txt** in the `src/mem` folder and paste your key in this file

## How to get started? 

After confirming all the prerequisites are in place, you can start the sync process by running the following command:
```bash 
npm run start
```

If this is the first time you are executing the sync, you'll need to grant access to your Matter feed. 
In this case the script will generate a file `files/login.svg`. 
This image contain a QR code that you'll need to scan with your Matter mobile app. 
This can be done by going to your profile and selecting **Sign into Web** option.
Once you've scanned the QR code, the script will save your login and continue the sync.
Next time you execute the script, it will automatically log you in through the token of previous run.

## Important files




