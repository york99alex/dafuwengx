/** @noSelfInFile */
// 导出的预载入方法，用来给addon_game_mode.ts调用
export default function Precache(context: CScriptPrecacheContext) {
    // 需要预载的所有资源
    precacheResource(
        [
            // '***.vpcf',
            // 'soundevents/game_sounds_heroes/game_sounds_queenofpain.vsndevts',
            // '***.vmdl',
            'models/heroes/phantom_assassin/phantom_assassin.vmdl',
            'models/heroes/meepo/meepo.vmdl',
            'models/heroes/pudge/pudge.vmdl',
            'models/heroes/lina/lina.vmdl',
            'models/heroes/zeus/zeus.vmdl',
            'models/heroes/axe/axe.vmdl',
            'particles/units/heroes/hero_phantom_assassin/phantom_assassin_loadout.vpcf',
            'particles/generic_hero_status/hero_levelup.vpcf',
            'particles/units/heroes/hero_meepo/meepo_poof_start.vpcf',
            'particles/units/heroes/hero_meepo/meepo_loadout.vpcf',
            'particles/econ/items/pudge/pudge_trapper_beam_chain/pudge_nx_meathook.vpcf',
            'particles/econ/items/pudge/pudge_trapper_beam_chain/pudge_nx_meathook_hook.vpcf',
            'particles/units/heroes/hero_pudge/pudge_rot.vpcf',
            'particles/units/heroes/hero_lina/lina_spell_dragon_slave.vpcf',
            'particles/units/heroes/hero_dark_willow/dark_willow_wisp_spell_marker_ring.vpcf',
            'particles/units/heroes/hero_lina/lina_spell_light_strike_array.vpcf',
            'particles/generic_gameplay/generic_stunned.vpcf',
            'particles/units/heroes/hero_zuus/zuus_arc_lightning_head.vpcf',
            'particles/units/heroes/hero_zuus/zuus_thundergods_wrath.vpcf',
            'particles/econ/items/zeus/lightning_weapon_fx/zuus_lb_cfx_il.vpcf',
            'particles/units/heroes/hero_axe/axe_battle_hunger.vpcf',
            'soundevents/custom_sounds.vsndevts',
            'particles/units/heroes/hero_legion_commander/legion_commander_duel_victory.vpcf',
            'particles/econ/items/windrunner/windrunner_ti6/windrunner_spell_powershot_ti6_arc_b.vpcf',
            'particles/econ/items/shadow_shaman/shadow_shaman_ti8/shadow_shaman_ti8_ether_shock_target_snakes.vpcf',
            'particles/custom/path_ablt/path_ablt_nocdmana_1.vpcf',
            'particles/custom/path_ablt/path_ablt_nocdmana_2.vpcf',
            'particles/custom/path_ablt/path_ablt_nocdmana_21.vpcf',
            'particles/custom/path_ablt/path_ablt_nocdmana_3.vpcf',
            'particles/custom/path_ablt/path_ablt_nocdmana_31.vpcf',
            'models/creeps/neutral_creeps/n_creep_vulture_a/n_creep_vulture_a.vmdl',
            'particles/neutral_fx/tornado_ambient.vpcf',
            'particles/econ/items/omniknight/hammer_ti6_immortal/omniknight_purification_ti6_immortal.vpcf',
            'particles/units/heroes/hero_zuus/zuus_lightning_bolt.vpcf',
            // 'particles/water_impact/water_splash_03.vpcf',
            // 'particles/water_impact/water_splash_02.vpcf',
            // 'particles/water_impact/water_splash_01.vpcf',
            'particles/units/heroes/hero_zuus/zuus_base_attack.vpcf',
            'particles/units/heroes/hero_lina/lina_base_attack.vpcf',
            'effect/arrow/star1.vpcf',
            'effect/arrow/star2.vpcf',
            'effect/arrow/star2_1.vpcf',
            'effect/arrow/star3.vpcf',
            'effect/arrow/star3_1.vpcf',
            'effect/arrow/star3_2.vpcf',
            'particles/units/heroes/hero_legion_commander/legion_duel_ring.vpcf',
            'particles/ui/ui_game_start_hero_spawn.vpcf',
            'particles/units/heroes/hero_doom_bringer/doom_bringer_doom.vpcf',
            'particles/generic_gameplay/rune_doubledamage.vpcf',
            'particles/generic_gameplay/rune_haste.vpcf',
            'particles/generic_gameplay/rune_invisibility.vpcf',
            'particles/generic_gameplay/rune_regeneration.vpcf',
            'particles/generic_gameplay/rune_bounty.vpcf',
            'particles/generic_gameplay/rune_arcane.vpcf',
            'particles/generic_gameplay/rune_shield.vpcf',
            'particles/generic_gameplay/rune_wisdom.vpcf',
            'particles/generic_gameplay/rune_doubledamage_owner.vpcf',
            'particles/generic_gameplay/rune_haste_owner.vpcf',
            'particles/generic_hero_status/status_invisibility_start.vpcf',
            'particles/generic_gameplay/rune_regen_owner.vpcf',
            'particles/generic_gameplay/rune_bounty_owner.vpcf',
            'particles/generic_gameplay/rune_arcane_owner.vpcf',
            'particles/status_fx/status_effect_shield_rune.vpcf',
            'particles/econ/items/outworld_devourer/od_shards_exile/od_shards_exile_prison_start.vpcf',
            'particles/events/ti6_teams/teleport_start_ti6_lvl3_wings_gaming.vpcf',
            'particles/items_fx/blink_dagger_start.vpcf',
            'particles/items_fx/blink_dagger_end.vpcf',
            'particles/items_fx/arcane_boots.vpcf',
            'particles/items_fx/arcane_boots_recipient.vpcf',
            'particles/status_fx/status_effect_ghost.vpcf',
            'particles/items_fx/ghost.vpcf',
            'particles/items2_fx/orb_of_venom.vpcf',
            'particles/generic_gameplay/generic_lifesteal.vpcf',
            'particles/items2_fx/medallion_of_courage.vpcf',
            'particles/items2_fx/medallion_of_courage_friend.vpcf',
            'particles/custom/item_pipe_miss_1.vpcf',
            'particles/custom/item_pipe_miss_2.vpcf',
            'particles/custom/item_pipe_miss_3.vpcf',
            'particles/econ/items/oracle/oracle_fortune_ti7/oracle_fortune_ti7_purge_root_pnt.vpcf',
            'particles/econ/events/ti9/shovel_revealed_loot_variant_0_treasure.vpcf',
            'particles/generic_gameplay/rune_bounty_gold.vpcf',
            'particles/units/heroes/hero_bloodseeker/bloodseeker_rupture.vpcf',
            'particles/units/heroes/hero_bloodseeker/bloodseeker_thirst_owner.vpcf',
            'models/heroes/techies/fx_techiesfx_mine.vmdl',
            'particles/units/heroes/hero_techies/techies_suicide.vpcf',
            'particles/generic_gameplay/generic_silenced.vpcf',
            'particles/custom/abilitys/dragon_knight/dragon_knight_breathe_fire_0.vpcf',
            'particles/custom/abilitys/dragon_knight/dragon_knight_breathe_fire_2.vpcf',
            'particles/units/heroes/hero_dragon_knight/dragon_knight_breathe_fire.vpcf',
            'particles/units/heroes/hero_dragon_knight/dragon_knight_transform_red.vpcf',
            'particles/units/heroes/hero_dragon_knight/dragon_knight_transform_blue.vpcf',
            'particles/units/heroes/hero_dragon_knight/dragon_knight_transform_green.vpcf',
            'particles/units/heroes/hero_dragon_knight/dragon_knight_elder_dragon_corrosive.vpcf',
            'particles/units/heroes/hero_dragon_knight/dragon_knight_elder_dragon_fire.vpcf',
            'models/heroes/dragon_knight/dragon_knight.vmdl',
            'models/heroes/dragon_knight/dragon_knight_dragon.vmdl',
            'particles/units/heroes/hero_undying/undying_soul_rip_heal.vpcf',
            'particles/units/heroes/hero_undying/undying_soul_rip_damage.vpcf',
            'models/heroes/undying/undying_flesh_golem.vmdl',
            'models/items/undying/flesh_golem/davy_jones_set_davy_jones_set_kraken/davy_jones_set_davy_jones_set_kraken.vmdl',
            'models/items/undying/flesh_golem/ti9_cache_undying_carnivorous_parasitism_golem/ti9_cache_undying_carnivorous_parasitism_golem.vmdl',
            'models/heroes/undying/undying_tower.vmdl',
            'particles/econ/items/lifestealer/ls_ti9_immortal/ls_ti9_open_wounds.vpcf',
            'particles/econ/items/bloodseeker/bloodseeker_eztzhok_weapon/bloodseeker_bloodrage_ground_eztzhok_arc.vpcf',
            'particles/econ/items/ogre_magi/ogre_magi_jackpot/ogre_magi_jackpot_spindle_rig.vpcf',
            'particles/items_fx/blademail.vpcf',
            'particles/custom/item_crimson_guard.vpcf',
            'particles/units/heroes/hero_rubick/rubick_spell_steal.vpcf',
            'soundevents/game_sounds_heroes/game_sounds_rubick.vsndevts',
            'particles/units/heroes/hero_vengeful/vengeful_nether_swap.vpcf',
            'soundevents/game_sounds_heroes/game_sounds_vengefulspirit.vsndevts',
            'particles/units/heroes/hero_disruptor/disruptor_glimpse_targetstart.vpcf',
            'particles/units/heroes/hero_disruptor/disruptor_glimpse_travel.vpcf',
            'particles/units/heroes/hero_disruptor/disruptor_glimpse_targetend.vpcf',
            'soundevents/game_sounds_heroes/game_sounds_disruptor.vsndevts',
            'particles/units/heroes/hero_magnataur/magnataur_reverse_polarity.vpcf',
            'soundevents/game_sounds_heroes/game_sounds_magnataur.vsndevts',
            'particles/units/heroes/hero_bloodseeker/bloodseeker_bloodrage.vpcf',
            'particles/units/heroes/hero_chen/chen_hand_of_god.vpcf',
            'particles/items2_fx/refresher.vpcf',
            'particles/units/heroes/hero_ursa/ursa_earthshock.vpcf',
            'soundevents/game_sounds_heroes/game_sounds_ursa.vsndevts',
            'particles/units/heroes/hero_ursa/ursa_fury_swipes_debuff.vpcf',
            'particles/units/heroes/hero_ursa/ursa_fury_swipes.vpcf',
        ],
        context
    );
    // 需要预载入的kv文件，会自动解析KV文件中的所有vpcf资源等等
    precacheEveryResourceInKV(
        [
            // kv文件路径
            // 'npc_abilities_custom.txt',
        ],
        context
    );
    // 需要预载入的单位
    precacheUnits(
        [
            // 单位名称
            // 'npc_dota_hero_***',
        ],
        context
    );
    // 需要预载入的物品
    precacheItems(
        [
            // 物品名称
            // 'item_***',
        ],
        context
    );
    print(`[Precache] Precache finished.`);
}

// 预载入KV文件中的所有资源
function precacheEveryResourceInKV(kvFileList: string[], context: CScriptPrecacheContext) {
    kvFileList.forEach(file => {
        const kvTable = LoadKeyValues(file);
        precacheEverythingFromTable(kvTable, context);
    });
}
// 预载入资源列表
function precacheResource(resourceList: string[], context: CScriptPrecacheContext) {
    resourceList.forEach(resource => {
        precacheResString(resource, context);
    });
}
function precacheResString(res: string, context: CScriptPrecacheContext) {
    if (res.endsWith('.vpcf')) {
        PrecacheResource('particle', res, context);
    } else if (res.endsWith('.vsndevts')) {
        PrecacheResource('soundfile', res, context);
    } else if (res.endsWith('.vmdl')) {
        PrecacheResource('model', res, context);
    }
}

// 预载入单位列表
function precacheUnits(unitNamesList: string[], context?: CScriptPrecacheContext) {
    if (context != null) {
        unitNamesList.forEach(unitName => {
            PrecacheUnitByNameSync(unitName, context);
        });
    } else {
        unitNamesList.forEach(unitName => {
            PrecacheUnitByNameAsync(unitName, () => {});
        });
    }
}
// 预载入物品列表
function precacheItems(itemList: string[], context: CScriptPrecacheContext) {
    itemList.forEach(itemName => {
        PrecacheItemByNameSync(itemName, context);
    });
}

// 一个辅助的，从KV表中解析出所有资源并预载入的方法
function precacheEverythingFromTable(kvTable: any, context: CScriptPrecacheContext) {
    for (const [k, v] of pairs(kvTable)) {
        if (type(v) === 'table') {
            precacheEverythingFromTable(v, context);
        } else if (type(v) === 'string') {
            precacheResString(v, context);
        }
    }
}
