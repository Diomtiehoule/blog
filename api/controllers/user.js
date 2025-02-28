import User from '../models/user.js';
// eslint-disable-next-line no-unused-vars
import express from 'express';
import { compareHash, hash } from '../utils/hash.js';
import { generateToken } from '../utils/token.js';
class UserController {
  /**
   *
   * @param {express.Request} req
   * @param {express.Response} res
   */
  static async getUser(req, res) {
    const { id } = req.params;
    try {
      const user = await User.findById(id);

      if (user) {
        return res.status(200).json({
          status: true,
          message: { ...user.toObject(), password: undefined },
        });
      }

      res.status(404).json({ status: false, message: '  non trouvé' });
    } catch (e) {
      console.log('erreur');
      res
        .status(500)
        .json({ status: false, message: 'Erreur interne du serveur' });
    }
  }

  /**
   *
   * @param {express.Request} req
   * @param {express.Response} res
   */
  static async createUser(req, res) {
    // eslint-disable-next-line no-unused-vars
    const { role, password, ...body } = req.body;

    try {
      const user = await User.create({
        ...body,
        password: hash(password),
      });

      res.status(201).json({
        status: true,
        message: { ...user.toObject(), password: undefined },
      });
    } catch (e) {
      res.json({ status: false, message: e.message });
    }
  }

  /**
   *
   * @param {express.Request} req
   * @param {express.Response} res
   */
  static async deleteUser(req, res) {
    const { id } = req.params;
    const auth = req.auth;

    try {
      if (id !== auth._id) {
        return res
          .status(401)
          .json({ status: false, message: 'action non authorisé' });
      }

      await User.deleteOne({ _id: id });
      res.status(200).json({ status: true, message: 'succès' });
    } catch (e) {
      res.json({ status: false, message: e.message });
    }
  }
  /**
   *
   * @param {express.Request} req
   * @param {express.Response} res
   */
  static async editUser(req, res) {
    // eslint-disable-next-line no-unused-vars
    const { role, password, newPassword, ...body } = req.body;
    const { id } = req.params;

    try {
      const user = await User.findById(id);
      const auth = req.auth;

      if (!user) {
        return res
          .status(404)
          .json({ status: false, message: 'utiliseur non trouvé' });
      }

      if (compareHash(password, user.password) && auth._id === id) {
        let updatedUser;

        if (newPassword) {
          updatedUser = await User.updateOne(
            { _id: id },
            {
              ...body,
              password: hash(password),
            }
          );
        } else {
          updatedUser = await User.updateOne({ _id: id }, { ...body });
        }

        return res.status(200).json({
          status: true,
          message: { ...updatedUser, password: undefined },
        });
      }

      res.status(401).json({ status: false, message: 'action non authorisé' });
    } catch (e) {
      console.log(e);
      res.json({ status: false, message: e.message });
    }
  }

  /**
   *
   * @param {express.Request} req
   * @param {express.Response} res
   */
  static async loginUser(req, res) {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });

      if (user && (await compareHash(password, user.password))) {
        // l'utilisateur est connecté
        console.log(generateToken(user.toObject()));
        res.cookie('token', generateToken(user.toObject()));
        return res.status(200).json({
          status: true,
          user,
        });
      }
      res.status(401).json({ status: false, message: 'identifiant invalide' });
    } catch (e) {
      console.log(e);
      res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
  }
}

export default UserController;
