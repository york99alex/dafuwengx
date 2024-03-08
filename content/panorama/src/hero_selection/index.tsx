import { render } from 'react-panorama-x';
import { getHeroBZAbility } from '../utils/useful';

const SelectHero = $.GetContextPanel().GetParent()!.GetParent()!.GetParent()!;
export function HideHudElement(context: Panel, name: string) {
    const element = context.FindChildTraverse(name);
    element != null ? (element.visible = false) : null;
}
export function HideHudClassElement(context: Panel, classname: string) {
    context.FindChildrenWithClassTraverse(classname).forEach(x => (x.visible = false));
}

HideHudElement(SelectHero, 'PreMinimapContainer');
HideHudElement(SelectHero, 'ViewModeControls');
HideHudElement(SelectHero, 'FriendsAndFoes');
// @ts-ignore
SelectHero.FindChildTraverse('GameModeLabel')!.text = $.Localize('#addon_game_name');

let child = SelectHero.FindChildTraverse('GridCategories');
if (child) {
    child.style.flowChildren = 'down';
    child.style.width = '55%';
    child.style.horizontalAlign = 'right';
}

child = SelectHero.FindChildTraverse('BottomPanels');
if (child) child.style.horizontalAlign = 'center';

child = SelectHero.FindChildTraverse('HeroAbilities');
if (child) {
    child.style.marginLeft = '40px';
    child.style.marginRight = '40px';
}

const heronameLabel = SelectHero.FindChildTraverse('HeroInspectHeroName')! as LabelPanel;
let heroname: string = heronameLabel.text;
setInterval(() => {
    if (!heronameLabel.text || heronameLabel.text == undefined || heronameLabel.text == '') return;
    if (heroname == heronameLabel.text) return;
    heroname = heronameLabel.text;
    console.log(heroname);

    HideHudClassElement(SelectHero, 'ScepterDetails');
    HideHudClassElement(SelectHero, 'SimilarHeroes');
    const soldierAbilities = $.CreatePanel('Panel', SelectHero.FindChildTraverse('HeroAbilities')!, 'SoldierAbilities');
    soldierAbilities.style.flowChildren = 'right';
    soldierAbilities.style.width = 'fill-parent-flow( 2.0 )';
    soldierAbilities.style.height = 'width-percentage( 50% )';

    const soldierLabel = $.CreatePanel('Label', soldierAbilities!, 'AbilitiesLab');
    soldierLabel.style.width = '60%';
    soldierLabel.style.height = '80%';
    soldierLabel.style.textOverflow = 'shrink';
    soldierLabel.style.verticalAlign = 'center';
    soldierLabel.style.fontFamily = 'titleFont';
    soldierLabel.style.color = 'white';
    soldierLabel.style.border = '2px solid grey';
    soldierLabel.style.marginRight = '5px';
    soldierLabel.style.tooltipPosition = 'bottom';
    soldierLabel.text = $.Localize('#SoldierAbility');
    soldierLabel.SetPanelEvent('onmouseover', () => {
        $.DispatchEvent('DOTAShowTextTooltip', soldierLabel, $.Localize('#texttip_SoldierAbility'));
    });
    soldierLabel.SetPanelEvent('onmouseout', () => {
        $.DispatchEvent('DOTAHideTextTooltip', soldierLabel);
    });

    const soldierAbiliImage = $.CreatePanel('DOTAAbilityImage', soldierAbilities!, '');
    soldierAbiliImage.style.tooltipPosition = 'bottom';
    soldierAbiliImage.abilityname = getHeroBZAbility(heroname);
    soldierAbiliImage.SetPanelEvent('onmouseover', () => {
        $.DispatchEvent('DOTAShowAbilityTooltip', soldierAbiliImage, soldierAbiliImage.abilityname);
    });
    soldierAbiliImage.SetPanelEvent('onmouseout', () => {
        $.DispatchEvent('DOTAHideAbilityTooltip');
    });
}, 10);

render(<></>, $.GetContextPanel());
