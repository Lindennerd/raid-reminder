const { names } = require('debug');
const request = require('request-promise');
const xml = require('xml2js');
const softResModel = require('../model/softres.model');


module.exports = function () {
    const softresApi = 'https://softres.it/api/raid/';

    async function register(req, res, next) {
        const softresId = getSoftResId(req.body.softres);
        const raid = JSON.parse(await request.get(softresApi + '/' + softresId));

        const hasSoftRes = findSoftRes(req.body.charName, raid.reserved);


        if (!hasSoftRes) {
            res.render('index', { warning: 'Soft Reserve not found for this raid.' });
            return;
        } else {
            const nameRegex = new RegExp('^' + hasSoftRes.name + '$', 'i');

            softResModel.find({
                $and: [
                    { charName: nameRegex },
                    { softResLink: req.body.softres }
                ]
            }, function (err, docs) {
                if (docs.length) {
                    res.render('index',
                        { warning: 'You already have registered the subscription to this raid.' });
                    return;
                } else {
                    const newSoftRes = new softResModel({
                        charName: hasSoftRes.name,
                        class: hasSoftRes.class,
                        raidDate: raid.raidDate,
                        discordInvite: raid.discordInvite,
                        softResLink: req.body.softres
                    });

                    getReservedItems(hasSoftRes.items, function (items) {
                        newSoftRes.softResItems.push(items);
                        newSoftRes.save();

                        res.redirect('calendar');
                    });
                }
            })
        }

    }

    async function calendar(req, res, next) {
        const filter = req.body.charName 
            ? {
                raidDate: { $gte: new Date().toISOString() },
                charName: req.query.charName
            } 
            : {raidDate: { $gte: new Date().toISOString() } };

        softResModel.find(filter, function (err, docs) {
            res.render('calendar', { reserves: docs });
         })
    }

    function getSoftResId(softres) {
        if (!softres.startsWith('http')) {
            return softres;
        } else {
            return softres.substring(
                softres.lastIndexOf('/') + 1
            );
        }
    }

    function findSoftRes(charName, reserved) {
        return reserved.find(function (char) {
            return char.name.toUpperCase() === charName.toUpperCase()
        })
    }

    function getReservedItems(items, cb) {
        return items.map(item => {
            const itemLink = 'https://classic.wowhead.com/item=' + item;
            request.get(itemLink + '&xml', null, function (error, response) {
                xml.parseString(response.body, function (error, result) {
                    var parsedItem = result.wowhead.item[0];

                    cb({
                        itemLink: itemLink,
                        itemInfo: {
                            itemLink: item.itemLink,
                            name: parsedItem.name[0],
                            quality: parsedItem.quality[0].$.id,
                            icon: parsedItem.icon[0]['_'],
                            tooltip: parsedItem.htmlTooltip[0]
                        }
                    });
                })
            });
        })
    }

    return {
        register: register,
        calendar: calendar
    }
}();