/**
 * The base user model
 */
module.exports = class Player {
    constructor (name, skills = {}, bosses = {}, clues = {}) {
        this.name = name
        this.skills = this.setSkills(skills)
        this.bosses = this.setBosses(bosses)
        this.clues = this.setClues(clues)
    }

    setSkills (skillsObj) {
        let keys = Object.keys(skillsObj)
        if (keys.length === 0) return {}

        // loop through, remove extraneous info, and parse level to an int for easy future comparison
        keys.forEach((key) => (skillsObj[key] = parseInt(skillsObj[key].level)));

        return skillsObj
    }

    setBosses (bossesObj) {
        let keys = Object.keys(bossesObj)
        if (keys.length === 0) return {}

        // loop and parseInt values
        keys.forEach((key) => (bossesObj[key] = {
            rank: parseInt(bossesObj[key].rank),
            score: parseInt(bossesObj[key].score)
        }))

        return bossesObj
    }

    setClues (cluesObj) {
        let keys = Object.keys(cluesObj)
        if (keys.length === 0) return {}

        // loop and parseInt values
        keys.forEach((key) => (cluesObj[key] = {
            rank: parseInt(cluesObj[key].rank),
            score: parseInt(cluesObj[key].score)
        }))

        return cluesObj
    }
}