import * as fs from 'fs';
import {MemClient} from "@mem-labs/mem-node";
import {Annotation, Article} from "../matter/models";
import {MemClientCreateMemArgs} from "@mem-labs/mem-node/dist/mem-client/methods/createMem";
import {createDir} from "../utils";

export class MemAPI {
    private BASE = './files/mem';
    private SYNCED_ARTICLES_FILES = `${this.BASE}/synced_articles.json`;

    private client: MemClient;
    private syncedArticles: string[] = [];

    constructor(keyFile: string) {
        createDir(this.BASE);
        this.client = new MemClient({
            apiAccessToken: this.getAPIKey(keyFile)
        });
        this.syncedArticles = this.getSyncedArticles();
    }

    /**
     * Sync a list of Matter articles to the mem.ai
     * @param articles - Array of Matter articles to sync
     */
    public async syncArticles(articles: Article[]): Promise<string[]> {
        // Transform the articles to a mem, but skip those articles that were already synced
        const mems: { article: Article, mem: MemClientCreateMemArgs }[] = articles
            .filter((a: Article) => !this.isArticleSynced(a.id))
            .map(((a: Article) => ({
                article: a,
                mem: this.transformArticle(a)
            })));
        const synced = [];

        for (const mem of mems) {
            console.log(`\x1b[1m\x1b[94mSyncing\x1b[0m - ${mem.article.content.title}`);
            await this.client.createMem(mem.mem);
            synced.push(mem.article.id);
        }

        // Update the list of synced articles
        this.syncedArticles.push(...synced);
        this.saveSyncedArticles();

        return synced;
    }

    /**
     * Check if an article was already synced based on its ID
     * @param id - ID of the article to check
     * @private
     */
    private isArticleSynced(id: string): boolean {
        return this.syncedArticles.includes(id);

    }

    /**
     * Transform a Matter article to a mem
     * @param article - Matter article object containing relevant information to create the mem
     * @private
     */
    private transformArticle(article: Article): MemClientCreateMemArgs {
        const lines = [
            `#  ${article.content.title}`,
            '## Info',
            `- **AUTHOR**: ${article.content.author?.any_name}`,
            `- **URL**: ${article.content.url}`,
            '---',
            '## Summary',
            '---',
            '## Notes',
            ...article.content.my_annotations.map((a: Annotation) => `- ${a.text}`)
        ]
        return {
            content: lines.join('\r\n')
        }
    }

    /**
     * Read the API key from disk in order to set up a connection with mem
     * @param file - File path that contains the mem API key
     * @private
     */
    private getAPIKey(file: string): string {
        return fs.readFileSync(file).toString().trim();
    }

    /**
     * Get the list of IDs representing the articles that were already synced to mem. This prevents them from being
     * created multiple times as the current version does not allow updating an existing mem.
     * @private
     */
    private getSyncedArticles(): string[] {
        return fs.existsSync(this.SYNCED_ARTICLES_FILES) ?
            JSON.parse(fs.readFileSync(this.SYNCED_ARTICLES_FILES).toString()) as unknown as string[] : [];
    }

    /**
     * Save the list of synced articles back to disk for later use.
     * @private
     */
    private saveSyncedArticles(): void {
        fs.writeFileSync(this.SYNCED_ARTICLES_FILES, JSON.stringify(this.syncedArticles));
    }
}
