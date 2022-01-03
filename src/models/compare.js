/**
 * Comparison logic for a player
 */
module.exports = class Compare {
    constructor (currentPlayerState, DBPlayerState) {
        // set name
        this.name = currentPlayerState.name

        // remove name duplicates
        delete currentPlayerState.name
        delete DBPlayerState.name

        // finish setting states
        this.current = currentPlayerState;
        this.previous = DBPlayerState;
    }

    get updatedSkills () {

    }

    get updatedClues () {

    }

    get updatedBosses () {

    }

    /**
     * Stores the logic for at a high level, determining if 
     * Return a boolean
     */
    get hasProgressed () {
        
    }
}