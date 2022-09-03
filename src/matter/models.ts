export interface MatterAuth {
    access_token: string;
    refresh_token: string;
}

export interface Annotation {
    created_date: string;
    note: string | null;
    text: string;
    word_start: number;
    word_end: number;
}

export interface Author {
    any_name: string | null;
}

export interface ContentNote {
    note: string;
}

export interface Publisher {
    any_name: string | null;
}

export interface Tag {
    created_date: string;
    name: string;
}
export interface ContentHistory {
    last_read_percentage: number;
    max_read_percentage: number;
}
export interface Content {
    author: Author;
    publisher: Publisher;
    my_annotations: Annotation[];
    my_note: ContentNote;
    publication_date: string;
    history: ContentHistory;
    tags: Tag[];
    title: string;
    url: string;
}

export interface Article {
    annotations: Annotation[];
    content: Content;
    feed_context: any;
    id: string;
    recommendations: any[];
}

export interface ArticleResponse {
    current_profile: any;
    feed: Article[];
    id: string;
    next: string | null;
    previous: string | null;
}
