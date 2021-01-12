import * as Knex from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("musics", table => {
        table.increments("music_id");
        table.string("music_title");
        table.string("music_name");
        table.string("music_duration");
        table.string("music_extension");
        table.string("music_size");
        table.string("music_url");
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("musics");
}

