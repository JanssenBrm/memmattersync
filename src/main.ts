import {MatterAPI} from "./matter";
import {Article} from "./matter/models";
import * as fs from 'fs';
import {MemAPI} from "./mem";

const getHighlightsFromMatter = async () => {
    const plugin = new MatterAPI()
    await plugin.login();
    const articles: Article[] = await plugin.getHighlightedArticles();
    return articles;
}

const syncWithMem = async (articles: Article[]): Promise<string[]> => {
   const mem = new MemAPI('./src/mem/apikey.txt');
   return (await mem.syncArticles(articles));
}

const syncHighlights = async (): Promise<string[]> => {
    const articles: Article[] = await getHighlightsFromMatter();
    return (await syncWithMem(articles));
}

syncHighlights()
    .then((ids: string[]) => {
        console.log(`\x1b[1m\x1b[92mDONE\x1b[0m - Synced \x1b[1m\x1b[92m${ids.length} articles\x1b[0m with mem.ai!`);
    })
