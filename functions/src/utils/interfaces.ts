export interface User {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    language_code: string;
    is_bot: Boolean;
    state: string           // for ex: warn_creation|warn_id
    messenger: string,
    document_id: string
}