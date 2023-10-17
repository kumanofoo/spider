import { Card } from "./spider";
import { getCardImage } from "./utils";

type StockProps = {
    cards: Card[],
    onDealout: () => void,
}

/**
 * Card Stock
 * @param param0 
 */
function Stock({cards, onDealout}: StockProps ) {
    const stock = cards.map((card, row) => {
        const card_img = getCardImage(card).front;
        if (row == 0) {
            return (<img
                    src={card_img}
                    className='card'
                    style={{marginLeft: "0px"}}
                    key={row}
                    onClick={() => onDealout()}
                />)
        } 
        else {
            return (<img
                    className='card'
                    src={card_img}
                    key={row}
                    onClick={() => onDealout()}
                />)
        }
    });
    if (cards.length == 0) {
        return (
            <div id="stock">
                <svg><rect className="emptycard" x="0" y="0" /></svg>
            </div>)
    }
    else {
        return (<div id="stock">{stock}</div>);
    }
}

export default Stock;