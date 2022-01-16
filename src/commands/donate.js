/**
 * Send information about donating
 * @param {Object} channel 
 */
module.exports = function donate(channel) {
    const donationURL = "https://www.buymeacoffee.com/osrsbuddy/"
    const websiteURL = "https://osrsbuddy.com/"
    // send a msg
    channel.send(`Thank you for your interest in donating to OSRS Buddy Bot! Anything you feel compelled to donate is appreciated - *nothing is too small!* ${donationURL}`)
}