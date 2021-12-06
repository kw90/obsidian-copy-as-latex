import { App, Editor, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import {fromMarkdown} from 'mdast-util-from-markdown'

import { syntax } from 'micromark-extension-wiki-link'
import * as wikiLink from 'mdast-util-wiki-link'
import {gfm} from 'micromark-extension-gfm'
import {gfmFromMarkdown, gfmToMarkdown} from 'mdast-util-gfm'

import { Code, Heading, Link, List, Node, Parent } from 'mdast-util-from-markdown/lib';
import { Literal } from 'mdast';
import {ASTtoString,ConversionSettings} from './convert'


export default class CopyAsLatexPlugin extends Plugin {
	settings: CopyAsLatexPluginSettings; 
	remarkSetup = {
		extensions: [syntax(),gfm()],
		mdastExtensions: [wikiLink.fromMarkdown(),gfmFromMarkdown()]
	}

	async onload() {
		console.log('loading Copy as Latex');
		await this.loadSettings();
		this.addCommand({
			id: 'copy-as-latex',
			name: 'Copy as Latex',
			editorCallback: (editor, _) => this.markdownToLatex(editor)
		});
		this.addSettingTab(new CopyAsLatexSettingTab(this.app, this));
	}

	markdownToLatex(editor:Editor) {
		let text = editor.getSelection();
		if( this.settings.logOutput ) {console.log(text); }
		const ast:Node = fromMarkdown(text, this.remarkSetup);
		if( this.settings.logOutput ) {console.log(ast);}
		const result = ASTtoString(ast,this.settings)
		if( this.settings.logOutput ) {console.log(result);}
		navigator.clipboard.writeText(result)
		return true;
	}

	onunload() {
		console.log('unloading plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


/* No settings provided yet... */

export interface CopyAsLatexPluginSettings extends ConversionSettings {
	logOutput: boolean;
}

const DEFAULT_SETTINGS: CopyAsLatexPluginSettings = {
	logOutput: false,
	inlineDelimiter:"",
	mintedListings: false
}

class CopyAsLatexSettingTab extends PluginSettingTab {
	plugin: CopyAsLatexPlugin;

	constructor(app: App, plugin: CopyAsLatexPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for Copy as Latex'});

		new Setting(containerEl)
		.setName('Log Output')
		.setDesc('Should the plugin log output to the Console - mostly just for debugging')
		.addToggle(toggle => toggle
			.setValue(this.plugin.settings.logOutput)
			.onChange(async (value) => {
				this.plugin.settings.logOutput = value;
				await this.plugin.saveSettings();
			}));
		new Setting(containerEl)
		.setName('Minted Output')
		.setDesc('Use the minted package for code listings? (Note: - not used for inline code at the moment)')
		.addToggle(toggle => toggle
			.setValue(this.plugin.settings.mintedListings)
			.onChange(async (value) => {
				this.plugin.settings.mintedListings = value;
				await this.plugin.saveSettings();
			}));		
		new Setting(containerEl)
		.setName('Inline delimiters')
		.setDesc('What delimiters to use for inline lstlistings? Default is curly braces ')
		.addText(text => text
			.setValue(this.plugin.settings.inlineDelimiter)
			.onChange(async (value) => {
				this.plugin.settings.inlineDelimiter = value;
				await this.plugin.saveSettings();
			}));

	}
}