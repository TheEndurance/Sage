import SimpleSchema from 'simpl-schema';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Portfolios } from '../collections/Portfolios.js'


export const createPortfolio = new ValidatedMethod({
    name: 'Portfolios.create',
    validate: new SimpleSchema({
        name: { type: String, min: 1 },
        description: { type: String, optional: true }
    }).validator(),
    run(newPortfolio) {
        const portfolio = Portfolios.findOne({ name: newPortfolio.name });
        if (portfolio) {
            throw new Meteor.Error('Portfolios.create.already-exists', 'A portfolio with that name already exists');
        }

        newPortfolio.createdAt = new Date();
        newPortfolio.transactions = [];
        
        Portfolios.insert(newPortfolio)
    }
});
