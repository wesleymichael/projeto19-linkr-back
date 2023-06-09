import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
import { insertUserDB } from "../repository/users.repository.js";

export async function signup(req, res) {
    const { username, email, password, picture } = req.body
    try {

        const hash = bcrypt.hashSync(password, 10)

        await insertUserDB(username, email, hash, picture);

        res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }
}

export async function signin(req, res) {
    try {
        const  user  = res.locals.session;
        const secretKey = process.env.SECRET_KEY
        const token = jwt.sign(user.rows[0], secretKey, { expiresIn: '24h' })

        const userData = {username: user.rows[0].username, img: user.rows[0].image }

        res.status(201).send({token, userData});
    } catch (err) {
        res.status(500).send(err.message)
    }
}