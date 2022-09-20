import { Field, ObjectType } from 'type-graphql';

@ObjectType({ description: "Details about the currency involved with a transaction" })
export class Currency {
    @Field(() =>
        String
        , { description: 'The symbol of the currency' })
    public symbol!: string;

    @Field(() =>
        String
        , { description: 'The name of the currency' })
    public name!: string;
}

// export interface Currency {
//     symbol: string;
//     name: string;
// }