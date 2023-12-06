import { getCardImage } from "./utils";
import { Card } from "./spider";

function MovingPile() {
    return <div id="movingpile"></div>;
}

type movingPileProps = {
    pile: Card[],
    src: {col: number, row: number} | null,
}

export const newMovingPile = () => {
    let movingPile: HTMLElement | null = null;
    const diff = {
        x: 0,
        y: 0,
    };
    const props: movingPileProps = {
        pile: [],
        src: null,
    }
    
    const handlePointerMove = (event: MouseEvent | TouchEvent) => {
        event.preventDefault();
        if (event instanceof MouseEvent) {
            move(event.pageX, event.pageY);
        }
        if (event instanceof TouchEvent) {
            move(event.touches[0].pageX, event.touches[0].pageY);
        }
    }

    /**
     * Set moving pile
     * @param cards put into moving pile
     * @param src source position of moving pile, pile number and row of top card
     * @param offsetLeft position from top-left corner of clicked down card
     * @param offsetTop position from top-left corner of cliecked down card
     * @param pageX position of clicked down mouse
     * @param pageY position of clicked down mouse
     * @returns void
     */
    const set = (
        cards: Card[],
        src: {col: number, row: number},
        offsetLeft: number,
        offsetTop: number,
        pageX: number,
        pageY: number) => {
        movingPile = document.getElementById('movingpile');
        if (!movingPile) {
            console.warn('emement ID "movingpile" not found');
            return;
        }
        diff.x = pageX - offsetLeft;
        diff.y = pageY - offsetTop;
        movingPile.innerHTML = '';
        cards.forEach((card, i) => {
            const img = document.createElement('img');
            img.src = getCardImage(card).front;
            if (i == 0) {
                img.style.marginTop = '0px';
            }
            img.classList.add('card');
            if (movingPile) movingPile.appendChild(img);
        });
        movingPile.style.left = (pageX - diff.x) + "px";
        movingPile.style.top = (pageY - diff.y) + "px";
        movingPile.style.display = 'flex';
        props.pile.push(...cards);
        props.src = src;
        window.addEventListener('mousemove', handlePointerMove);
        window.addEventListener('touchmove', handlePointerMove, {passive: false});
    }

    /**
     * Move the moving pile
     * @param pageX mouse position X
     * @param pageY mouse position Y
     * @returns void
     */
    const move = (pageX: number, pageY: number) => {
        if (!movingPile) return;
        if (movingPile?.innerHTML == '') return;

        let left = pageX - diff.x;
        let top = pageY - diff.y

        // check boundary
        const parent = movingPile?.offsetParent?.getBoundingClientRect();
        if (!parent) return;
        left = Math.max(left, 0);
        left = Math.min(left, parent.width - movingPile.offsetWidth);
        top = Math.max(top, 0);
        top = Math.min(top, parent.height - movingPile.offsetHeight);

        // move pile
        movingPile.style.left = left + "px";
        movingPile.style.top = top + "px";
    }

    /**
     * Remove the moving pile
     * @returns Cards in the moving pile and its original position
     */
    const remove = (): movingPileProps | null => {
        if (!movingPile) {
            return null;
        }
        movingPile.innerHTML = '';
        movingPile.style.display = 'none';
        movingPile = null;
        window.removeEventListener('mousemove', handlePointerMove);
        window.removeEventListener('touchmove', handlePointerMove);
        return {pile: props.pile.splice(0), src: props.src};
    }

    return {
        set: set,
        move: move,
        remove: remove,
    };
}

export const MPile = newMovingPile();
export default MovingPile;
