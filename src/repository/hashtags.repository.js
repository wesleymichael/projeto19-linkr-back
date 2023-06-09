import { db } from "../database/database.js";

export function insertNewHashtagsDB(postId,filteredHashtags){
    return db.query(
        `INSERT INTO hashtags ("postId", hashtag) 
            VALUES($1, unnest(array[$2::text[]]));`
        ,[postId, filteredHashtags]); 
}

export function getTopHashtagsDB(){
    return db.query(`
        SELECT hashtag FROM hashtags
                GROUP BY hashtag
                ORDER BY COUNT(*) DESC
                LIMIT 10;
    `);
}

export function getPostsByHashtagDB(params, userId, query){
    const {hashtag} = params;
    const firstPostReference = query.firstPost ? query.firstPost : "Infinity";
    const pageOffset = query.page>0 ? ((query.page)-1)*10 : 0;
    return db.query(`
    SELECT
        u.id,
        u.username,
        u.image,
        json_build_object(
            'id', p.id,
            'url', p.url,
            'description', p.description,
            'createdAt', p."createdAt",
            'likes', COUNT(l.id),
            'liked', EXISTS(SELECT 1 FROM likes WHERE "postId" = p.id AND "userId" = $2),
            'diffUser',(SELECT u.username FROM likes l
                JOIN users u ON u.id=l."userId"
                WHERE l."postId"=p.id AND "userId" <> $2
                ORDER BY l."createdAt" DESC
                LIMIT 1)
        ) AS post,
        json_agg(h.hashtag) AS hashtags,
        CAST(COUNT(c.id) AS INT) AS comments
    FROM
        users u
        JOIN posts p ON u.id = p."userId"
        LEFT JOIN likes l ON p.id = l."postId"
        LEFT JOIN hashtags h ON p.id = h."postId"
        LEFT JOIN comments c ON p.id = c."postId"        
    WHERE 
        h.hashtag=$1 AND p.id <= $3::float
    GROUP BY
        u.id,
        u.username,
        u.image,
        p.id,
        p.url,
        p.description,
        p."createdAt"
    ORDER BY
        p."createdAt" DESC
    OFFSET $4
    LIMIT 10;
        `
        ,[hashtag, userId, firstPostReference, pageOffset]);
}