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
        this.results = { skills: [], bosses: [], clues: [] } // where we store the results from the subsequent functions
        this.renderBlock = null
        this.content = {}

        // process all of the potential updates and prepare results
        this.updatedSkills()
        this.updatedClues()
        this.updatedBosses()

        // console.log('has progressed:', this.hasProgressed)
        // console.log('skills:', this.hasUpdatedSkills)
        // console.log('clues:', this.hasUpdatedClues)
        // console.log('bosses:', this.hasUpdatedBosses)

        // console.log(this.results)
    }

    updatedSkills () {
        let results = []

        for (const [skill, currentSkillLevel] of Object.entries(this.current.skills)) {
            // localize the previous skill level for comparison
            const previousSkillLevel = this.previous.skills[skill]
            // if the skill isn't the overall item and is greater than the previous value, push it
            if (currentSkillLevel > previousSkillLevel && skill !== "overall") {
                results.push({
                    skill,
                    level: currentSkillLevel,
                    variance: currentSkillLevel - previousSkillLevel
                })
            }
        }

        this.results.skills = results
    }

    updatedClues () {
        let results = []

        for (const [clueType, currentClueObj] of Object.entries(this.current.clues)) {
            // clue obj - rank and score
            const previousClueObj = this.previous.clues[clueType]
            if (currentClueObj.score > previousClueObj.score && clueType !== 'all') {
                results.push({
                    clueType,
                    ...currentClueObj,
                    variance: currentClueObj.score - ((previousClueObj.score == -1) ? 0 : previousClueObj.score) // handle API setting 0 to -1
                })
            }
        }

        this.results.clues = results
    }

    updatedBosses () {
        let results = []

        for (const [boss, currentBossObj] of Object.entries(this.current.bosses)) {
            const previousBossObj = this.previous.bosses[boss]
            if (currentBossObj.score > previousBossObj.score) {
                results.push({
                    boss,
                    ...currentBossObj,
                    variance: currentBossObj.score - ((previousBossObj.score == -1) ? 0 : previousBossObj.score) // handle API setting 0 to -1
                })
            }
        }

        this.results.bosses = results
    }

    get hasUpdatedSkills () {
        return this.results.skills.length > 0
    }

    get hasUpdatedClues () {
        return this.results.clues.length > 0
    }

    get hasUpdatedBosses () {
        return this.results.bosses.length > 0
    }

    /**
     * Stores the logic for at a high level, determining if 
     * Return a boolean
     */
    get hasProgressed () {
        return (this.hasUpdatedSkills || this.hasUpdatedClues || this.hasUpdatedBosses)
    }
}