import React, { DependencyList, ReactNode, RefCallback } from "react";

//#region src/internal/key.d.ts

/**
 * A const enum that includes all non-printable string values one can expect
 * from $event.key. For example, this enum includes values like "CapsLock",
 * "Backspace", and "AudioVolumeMute", but does not include values like "a",
 * "A", "#", "é", or "¿". Auto generated from MDN:
 * https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values#Speech_recognition_keys
 */
declare const Key: {
  /**
   * The Accept, Commit, or OK key or button. Accepts the currently selected
   * option or input method sequence conversion.
   */
  readonly Accept: "Accept";
  /** The numeric keypad's addition key, +. */
  readonly Add: "Add";
  /** The Again key. Redoes or repeats a previous action. */
  readonly Again: "Again";
  /**
   * The All Candidates key, which starts multi-candidate mode, in which
   * multiple candidates are displayed for the ongoing input.
   */
  readonly AllCandidates: "AllCandidates";
  /** The Alphanumeric key. */
  readonly Alphanumeric: "Alphanumeric";
  /**
   * The Alt (Alternative) key. This is the Option ⌥ key on Mac, or the Alt key
   * on Windows.
   */
  readonly Alt: "Alt";
  /**
   * The AltGr or AltGraph (Alternate Graphics) key. Enables the ISO Level 3
   * shift modifier (where Shift is the level 2 modifier).
   */
  readonly AltGraph: "AltGraph";
  /**
   * Presents a list of recently-used applications which lets the user change
   * apps quickly.
   */
  readonly AppSwitch: "AppSwitch";
  /** The down arrow key. */
  readonly ArrowDown: "ArrowDown";
  /** The left arrow key. */
  readonly ArrowLeft: "ArrowLeft";
  /** The right arrow key. */
  readonly ArrowRight: "ArrowRight";
  /** The up arrow key. */
  readonly ArrowUp: "ArrowUp";
  /** The Attn (Attention) key. */
  readonly Attn: "Attn";
  /** Adjusts audio balance toward the left. */
  readonly AudioBalanceLeft: "AudioBalanceLeft";
  /** Adjusts audio balance twoard the right. */
  readonly AudioBalanceRight: "AudioBalanceRight";
  /**
   * Reduces bass boosting or cycles downward through bass boost modes or
   * states.
   */
  readonly AudioBassBoostDown: "AudioBassBoostDown";
  /** Toggles bass boosting on and off. */
  readonly AudioBassBoostToggle: "AudioBassBoostToggle";
  /**
   * Increases the amoung of bass boosting, or cycles upward through a set of
   * bass boost modes or states.
   */
  readonly AudioBassBoostUp: "AudioBassBoostUp";
  /** Decreases the amount of bass. */
  readonly AudioBassDown: "AudioBassDown";
  /** Increases the amount of bass. */
  readonly AudioBassUp: "AudioBassUp";
  /** Adjusts the audio fader toward the front. */
  readonly AudioFaderFront: "AudioFaderFront";
  /** Adjustts the audio fader toward the rear. */
  readonly AudioFaderRear: "AudioFaderRear";
  /** Selects the next available surround sound mode. */
  readonly AudioSurroundModeNext: "AudioSurroundModeNext";
  /** Decreases the amount of treble. */
  readonly AudioTrebleDown: "AudioTrebleDown";
  /** Increases the amount of treble. */
  readonly AudioTrebleUp: "AudioTrebleUp";
  /** Decreases the audio volume. */
  readonly AudioVolumeDown: "AudioVolumeDown";
  /** Mutes the audio. */
  readonly AudioVolumeMute: "AudioVolumeMute";
  /** Increases the audio volume. */
  readonly AudioVolumeUp: "AudioVolumeUp";
  /** Changes the input mode on an external audio/video receiver (AVR) unit. */
  readonly AVRInput: "AVRInput";
  /** Toggles the power on an external AVR unit. */
  readonly AVRPower: "AVRPower";
  /** The Backspace key. This key is labeled Delete on Mac keyboards. */
  readonly Backspace: "Backspace";
  /**
   * The Brightness Down key. Typically used to reduce the brightness of the
   * display.
   */
  readonly BrightnessDown: "BrightnessDown";
  /** The Brightness Up key. Typically increases the brightness of the display. */
  readonly BrightnessUp: "BrightnessUp";
  /**
   * Navigates to the previous content or page in the current Web view's
   * history.
   */
  readonly BrowserBack: "BrowserBack";
  /** Opens the user's list of bookmarks/favorites. */
  readonly BrowserFavorites: "BrowserFavorites";
  /** Navigates to the next content or page in the current Web view's history. */
  readonly BrowserForward: "BrowserForward";
  /** Navigates to the user's preferred home page. */
  readonly BrowserHome: "BrowserHome";
  /** Refreshes the current page or contentl. */
  readonly BrowserRefresh: "BrowserRefresh";
  /**
   * Activates the user's preferred search engine or the search interface within
   * their browser.
   */
  readonly BrowserSearch: "BrowserSearch";
  /** Stops loading the currently displayed Web view or content. */
  readonly BrowserStop: "BrowserStop";
  /** The Call key; dials the number which has been entered. */
  readonly Call: "Call";
  /** The Camera key; activates the camera. */
  readonly Camera: "Camera";
  /** The Focus key; focuses the camera. */
  readonly CameraFocus: "CameraFocus";
  /** The Cancel key. */
  readonly Cancel: "Cancel";
  /**
   * The Caps Lock key. Toggles the capital character lock on and off for
   * subsequent input.
   */
  readonly CapsLock: "CapsLock";
  /** Switches to the previous channel. */
  readonly ChannelDown: "ChannelDown";
  /** Switches to the next channel. */
  readonly ChannelUp: "ChannelUp";
  /** The Clear key. Removes the currently selected input. */
  readonly Clear: "Clear";
  /** Closes the current document or message. Must not exit the application. */
  readonly Close: "Close";
  /** Toggles closed captioning on and off. */
  readonly ClosedCaptionToggle: "ClosedCaptionToggle";
  /**
   * The Code Input key, which enables code input mode, which lets the user
   * enter characters by typing their code points (their Unicode character
   * numbers, typically).
   */
  readonly CodeInput: "CodeInput";
  /**
   * General-purpose media function key, color-coded red; this has index 0 among
   * the colored keys.
   */
  readonly ColorF0Red: "ColorF0Red";
  /**
   * General-purpose media funciton key, color-coded green; this has index 1
   * among the colored keys.
   */
  readonly ColorF1Green: "ColorF1Green";
  /**
   * General-purpose media funciton key, color-coded yellow; this has index 2
   * among the colored keys.
   */
  readonly ColorF2Yellow: "ColorF2Yellow";
  /**
   * General-purpose media funciton key, color-coded blue; this has index 3
   * among the colored keys.
   */
  readonly ColorF3Blue: "ColorF3Blue";
  /**
   * General-purpose media funciton key, color-coded grey; this has index 4
   * among the colored keys.
   */
  readonly ColorF4Grey: "ColorF4Grey";
  /**
   * General-purpose media funciton key, color-coded brown; this has index 5
   * among the colored keys.
   */
  readonly ColorF5Brown: "ColorF5Brown";
  /** The Compose key. */
  readonly Compose: "Compose";
  /**
   * Shows the context menu. Typically found between the Windows (or OS) key and
   * the Control key on the right side of the keyboard.
   */
  readonly ContextMenu: "ContextMenu";
  /** The Control, Ctrl, or Ctl key. Allows typing control characters. */
  readonly Control: "Control";
  /**
   * The Convert key, which instructs the IME to convert the current input
   * method sequence into the resulting character.
   */
  readonly Convert: "Convert";
  /** The Copy key (on certain extended keyboards). */
  readonly Copy: "Copy";
  /** The Cursor Select key, CrSel. */
  readonly CrSel: "CrSel";
  /** The Cut key (on certain extended keyboards). */
  readonly Cut: "Cut";
  /**
   * A dead "combining" key; that is, a key which is used in tandem with other
   * keys to generate accented and other modified characters. If pressed by
   * itself, it doesn't generate a character. If you wish to identify which
   * specific dead key was pressed (in cases where more than one exists), you
   * can do so by examining the KeyboardEvent's associated compositionupdate
   * event's data property.
   */
  readonly Dead: "Dead";
  /**
   * The decimal point key (typically . or , depending on the region. In newer
   * browsers, this value to simply be the character generated by the decimal
   * key (one of those two characters). [1]
   */
  readonly Decimal: "Decimal";
  /** The Delete key, Del. */
  readonly Delete: "Delete";
  /**
   * Adjusts the brightness of the device by toggling between two brightness
   * levels or by cycling among multiple brightness levels.
   */
  readonly Dimmer: "Dimmer";
  /** Cycles among video sources. */
  readonly DisplaySwap: "DisplaySwap";
  /** The numeric keypad's division key, /. */
  readonly Divide: "Divide";
  /** Switches the input source to the Digital Video Recorder (DVR). */
  readonly DVR: "DVR";
  /**
   * The Eisu key. This key's purpose is defined by the IME, but may be used to
   * close the IME.
   */
  readonly Eisu: "Eisu";
  /**
   * The Eject key. Ejects removable media (or toggles an optical storage device
   * tray open and closed).
   */
  readonly Eject: "Eject";
  /** The End key. Moves to the end of content. */
  readonly End: "End";
  /** The End Call or Hang Up button. */
  readonly EndCall: "EndCall";
  /** The Enter or ↵ key (sometimes labeled Return). */
  readonly Enter: "Enter";
  /**
   * Erase to End of Field. Deletes all characters from the current cursor
   * position to the end of the current field.
   */
  readonly EraseEof: "EraseEof";
  /**
   * The Esc (Escape) key. Typically used as an exit, cancel, or "escape this
   * operation" button. Historically, the Escape character was used to signal
   * the start of a special control sequence of characters called an "escape
   * sequence."
   */
  readonly Escape: "Escape";
  /** The Execute key. */
  readonly Execute: "Execute";
  /** The Exit button, which exits the curreent application or menu. */
  readonly Exit: "Exit";
  /** The ExSel (Extend Selection) key. */
  readonly ExSel: "ExSel";
  /** The first general-purpose function key, F1. */
  readonly F1: "F1";
  /** The F2 key. */
  readonly F2: "F2";
  /** The F3 key. */
  readonly F3: "F3";
  /** The F4 key. */
  readonly F4: "F4";
  /** The F5 key. */
  readonly F5: "F5";
  /** The F6 key. */
  readonly F6: "F6";
  /** The F7 key. */
  readonly F7: "F7";
  /** The F8 key. */
  readonly F8: "F8";
  /** The F9 key. */
  readonly F9: "F9";
  /** The F10 key. */
  readonly F10: "F10";
  /** The F11 key. */
  readonly F11: "F11";
  /** The F12 key. */
  readonly F12: "F12";
  /** The F13 key. */
  readonly F13: "F13";
  /** The F14 key. */
  readonly F14: "F14";
  /** The F15 key. */
  readonly F15: "F15";
  /** The F16 key. */
  readonly F16: "F16";
  /** The F17 key. */
  readonly F17: "F17";
  /** The F18 key. */
  readonly F18: "F18";
  /** The F19 key. */
  readonly F19: "F19";
  /** The F20 key. */
  readonly F20: "F20";
  /** Clears the program or content stored in the first favorites list slot. */
  readonly FavoriteClear0: "FavoriteClear0";
  /** Clears the program or content stored in the second favorites list slot. */
  readonly FavoriteClear1: "FavoriteClear1";
  /** Clears the program or content stored in the third favorites list slot. */
  readonly FavoriteClear2: "FavoriteClear2";
  /** Clears the program or content stored in the fourth favorites list slot. */
  readonly FavoriteClear3: "FavoriteClear3";
  /**
   * Selects (recalls) the program or content stored in the first favorites list
   * slot.
   */
  readonly FavoriteRecall0: "FavoriteRecall0";
  /**
   * Selects (recalls) the program or content stored in the second favorites
   * list slot.
   */
  readonly FavoriteRecall1: "FavoriteRecall1";
  /**
   * Selects (recalls) the program or content stored in the third favorites list
   * slot.
   */
  readonly FavoriteRecall2: "FavoriteRecall2";
  /**
   * Selects (recalls) the program or content stored in the fourth favorites
   * list slot.
   */
  readonly FavoriteRecall3: "FavoriteRecall3";
  /** Stores the current program or content into the first favorites list slot. */
  readonly FavoriteStore0: "FavoriteStore0";
  /** Stores the current program or content into the second favorites list slot. */
  readonly FavoriteStore1: "FavoriteStore1";
  /** Stores the current program or content into the third favorites list slot. */
  readonly FavoriteStore2: "FavoriteStore2";
  /** Stores the current program or content into the fourth favorites list slot. */
  readonly FavoriteStore3: "FavoriteStore3";
  /**
   * The Final (Final Mode) key is used on some Asian keyboards to enter final
   * mode when using IMEs.
   */
  readonly FinalMode: "FinalMode";
  /**
   * The Find key. Opens an interface (typically a dialog box) for performing a
   * find/search operation.
   */
  readonly Find: "Find";
  /** The Finish key. */
  readonly Finish: "Finish";
  /**
   * The Fn (Function modifier) key. Used to allow generating function key
   * (F1-F15, for instance) characters on keyboards without a dedicated function
   * key area. Often handled in hardware so that events aren't generated for
   * this key.
   */
  readonly Fn: "Fn";
  /**
   * The FnLock or F-Lock (Function Lock) key.Toggles the function key mode
   * described by "Fn" on and off. Often handled in hardware so that events
   * aren't generated for this key.
   */
  readonly FnLock: "FnLock";
  /** The Back button. */
  readonly GoBack: "GoBack";
  /**
   * The Home button, which takes the user to the phone's main screen (usually
   * an application launcher).
   */
  readonly GoHome: "GoHome";
  /**
   * Switches to the first character group on an ISO/IEC 9995 keyboard. Each key
   * may have multiple groups of characters, each in its own column. Pressing
   * this key instructs the device to interpret keypresses as coming from the
   * first column on subsequent keystrokes.
   */
  readonly GroupFirst: "GroupFirst";
  /** Switches to the last character group on an ISO/IEC 9995 keyboard. */
  readonly GroupLast: "GroupLast";
  /** Switches to the next character group on an ISO/IEC 9995 keyboard. */
  readonly GroupNext: "GroupNext";
  /** Switches to the previous character group on an ISO/IEC 9995 keyboard. */
  readonly GroupPrevious: "GroupPrevious";
  /** Toggles the display of the program or content guide. */
  readonly Guide: "Guide";
  /**
   * If the guide is currently displayed, this button tells the guide to display
   * the next day's content.
   */
  readonly GuideNextDay: "GuideNextDay";
  /**
   * If the guide is currently displayed, this button tells the guide to display
   * the previous day's content.
   */
  readonly GuidePreviousDay: "GuidePreviousDay";
  /**
   * The Hangul (Korean character set) mode key, which toggles between Hangul
   * and English entry modes.
   */
  readonly HangulMode: "HangulMode";
  /**
   * Selects the Hanja mode, for converting Hangul characters to the more
   * specific Hanja characters.
   */
  readonly HanjaMode: "HanjaMode";
  /** The Hankaku (half-width characters) key. */
  readonly Hankaku: "Hankaku";
  /**
   * The Headset Hook key. This is typically actually a button on the headset
   * which is used to hang up calls and play or pause media.
   */
  readonly HeadsetHook: "HeadsetHook";
  /** The Help key. Opens or toggles the display of help information. */
  readonly Help: "Help";
  /**
   * The Hibernate key. This saves the state of the computer to disk and then
   * shuts down; the computer can be returned to its previous state by restoring
   * the saved state information.
   */
  readonly Hibernate: "Hibernate";
  /** The Hiragana key; selects Kana characters mode. */
  readonly Hiragana: "Hiragana";
  /** Toggles between the Hiragana and Katakana writing systems. */
  readonly HiraganaKatakana: "HiraganaKatakana";
  /** The Home key. Moves to the start of content. */
  readonly Home: "Home";
  /** The Hyper key. */
  readonly Hyper: "Hyper";
  /**
   * Toggles the display of information about the currently selected content,
   * program, or media.
   */
  readonly Info: "Info";
  /** The Insert key, Ins. Toggles between inserting and overwriting text. */
  readonly Insert: "Insert";
  /**
   * Tellls the device to perform an instant replay (typically some form of
   * jumping back a short amount of time then playing it again, possibly but not
   * usually in slow motion).
   */
  readonly InstantReplay: "InstantReplay";
  /**
   * Selects the Junja mode, in which Korean is represented using single-byte
   * Latin characters.
   */
  readonly JunjaMode: "JunjaMode";
  /** The Kana Mode (Kana Lock) key. */
  readonly KanaMode: "KanaMode";
  /**
   * The Kanji Mode key. Enables entering Japanese text using the ideographic
   * characters of Chinese origin.
   */
  readonly KanjiMode: "KanjiMode";
  /** The Katakana key. */
  readonly Katakana: "Katakana";
  /** The 11 key found on certain media numeric keypads. */
  readonly Key11: "Key11";
  /** The 12 key found on certain media numeric keypads. */
  readonly Key12: "Key12";
  /** The Redial button, which redials the last-called number. */
  readonly LastNumberRedial: "LastNumberRedial";
  /** The first generic application launcher button. */
  readonly LaunchApplication1: "LaunchApplication1";
  /** The second generic application launcher button. */
  readonly LaunchApplication2: "LaunchApplication2";
  /** The third generic application launcher button. */
  readonly LaunchApplication3: "LaunchApplication3";
  /** The fourth generic application launcher button. */
  readonly LaunchApplication4: "LaunchApplication4";
  /** The fifth generic application launcher button. */
  readonly LaunchApplication5: "LaunchApplication5";
  /** The sixth generic application launcher button. */
  readonly LaunchApplication6: "LaunchApplication6";
  /** The seventh generic application launcher button. */
  readonly LaunchApplication7: "LaunchApplication7";
  /** The eighth generic application launcher button. */
  readonly LaunchApplication8: "LaunchApplication8";
  /** The ninth generic application launcher button. */
  readonly LaunchApplication9: "LaunchApplication9";
  /** The 10th generic application launcher button. */
  readonly LaunchApplication10: "LaunchApplication10";
  /** The 11th generic application launcher button. */
  readonly LaunchApplication11: "LaunchApplication11";
  /** The 12th generic application launcher button. */
  readonly LaunchApplication12: "LaunchApplication12";
  /** The 13th generic application launcher button. */
  readonly LaunchApplication13: "LaunchApplication13";
  /** The 14th generic application launcher button. */
  readonly LaunchApplication14: "LaunchApplication14";
  /** The 15th generic application launcher button. */
  readonly LaunchApplication15: "LaunchApplication15";
  /** The 16th generic application launcher button. */
  readonly LaunchApplication16: "LaunchApplication16";
  /**
   * The Calculator key, often labeled with an icon such as . This is often used
   * as a generic application launcher key (APPCOMMAND_LAUNCH_APP2).
   */
  readonly LaunchCalculator: "LaunchCalculator";
  /** The Calendar key, often labeled with an icon like . */
  readonly LaunchCalendar: "LaunchCalendar";
  /** The Contacts key. */
  readonly LaunchContacts: "LaunchContacts";
  /** The Mail key. This is often displayed as . */
  readonly LaunchMail: "LaunchMail";
  /** The Media Player key. */
  readonly LaunchMediaPlayer: "LaunchMediaPlayer";
  /** The Music Player key, often labeled with an icon such as . */
  readonly LaunchMusicPlayer: "LaunchMusicPlayer";
  /**
   * The My Computer key on Windows keyboards. This is often used as a generic
   * application launcher key (APPCOMMAND_LAUNCH_APP1).
   */
  readonly LaunchMyComputer: "LaunchMyComputer";
  /** The Phone key, to open the phone dialer application if one is present. */
  readonly LaunchPhone: "LaunchPhone";
  /** The Screen Saver key. */
  readonly LaunchScreenSaver: "LaunchScreenSaver";
  /**
   * The Spreadsheet key. This key may be labeled with an icon such as or that
   * of a specific spreadsheet application.
   */
  readonly LaunchSpreadsheet: "LaunchSpreadsheet";
  /**
   * The Web Browser key. This key is frequently labeled with an icon such as or
   * the icon of a specific browser, depending on the device manufacturer.
   */
  readonly LaunchWebBrowser: "LaunchWebBrowser";
  /** The WebCam key. Opens the webcam application. */
  readonly LaunchWebCam: "LaunchWebCam";
  /**
   * The Word Processor key. This may be an icon of a specific word processor
   * application, or a generic document icon.
   */
  readonly LaunchWordProcessor: "LaunchWordProcessor";
  /** Opens content liniked to the current program, if available and possible. */
  readonly Link: "Link";
  /** Lists the current program. */
  readonly ListProgram: "ListProgram";
  /** Toggles a display listing currently available live content or programs. */
  readonly LiveContent: "LiveContent";
  /** Locks or unlocks the currently selected content or pgoram. */
  readonly Lock: "Lock";
  /** The LogOff key. */
  readonly LogOff: "LogOff";
  /** Opens the user interface to forward a message. */
  readonly MailForward: "MailForward";
  /** Opens the user interface to reply to a message. */
  readonly MailReply: "MailReply";
  /** Sends the current message. */
  readonly MailSend: "MailSend";
  /**
   * A button which cycles among the notification modes: silent, vibrate, ring,
   * and so forth.
   */
  readonly MannerMode: "MannerMode";
  /**
   * Presents a list of media applications, such as photo viewers, audio and
   * video players, and games. [1]
   */
  readonly MediaApps: "MediaApps";
  /** The Audio Track key. */
  readonly MediaAudioTrack: "MediaAudioTrack";
  /** Starts, continues, or increases the speed of fast forwarding the media. */
  readonly MediaFastForward: "MediaFastForward";
  /** Jumps back to the last-viewed content, program, or other media. */
  readonly MediaLast: "MediaLast";
  /**
   * Pauses the currently playing media. Some older applications use simply
   * "Pause" but this is not correct.
   */
  readonly MediaPause: "MediaPause";
  /**
   * Starts or continues playing media at normal speed, if not already doing so.
   * Has no effect otherwise.
   */
  readonly MediaPlay: "MediaPlay";
  /** Toggles between playing and pausing the current media. */
  readonly MediaPlayPause: "MediaPlayPause";
  /** Starts or resumes recording media. */
  readonly MediaRecord: "MediaRecord";
  /** Starts, continues, or increases the speed of rewinding the media. */
  readonly MediaRewind: "MediaRewind";
  /** Skips backward to the previous content or program. */
  readonly MediaSkipBackward: "MediaSkipBackward";
  /** Skips forward to the next content or program. */
  readonly MediaSkipForward: "MediaSkipForward";
  /** Steps backward to the previous content or program. */
  readonly MediaStepBackward: "MediaStepBackward";
  /** Steps forward to the next content or program. */
  readonly MediaStepForward: "MediaStepForward";
  /**
   * Stops the current media activity (such as playing, recording, pausing,
   * forwarding, or rewinding). Has no effect if the media is currently stopped
   * already.
   */
  readonly MediaStop: "MediaStop";
  /**
   * Top Menu button; opens the media's main menu, such as on a DVD or Blu-Ray
   * disc.
   */
  readonly MediaTopMenu: "MediaTopMenu";
  /** Seeks to the next media or program track. */
  readonly MediaTrackNext: "MediaTrackNext";
  /** Seeks to the previous media or program track. */
  readonly MediaTrackPrevious: "MediaTrackPrevious";
  /**
   * The Meta key. Allows issuing special command inputs. This is the Windows
   * logo key, or the Command ⌘ key on Mac.
   */
  readonly Meta: "Meta";
  /** Toggles the microphone on and off. */
  readonly MicrophoneToggle: "MicrophoneToggle";
  /** Decreases the microphone's input volume. */
  readonly MicrophoneVolumeDown: "MicrophoneVolumeDown";
  /** Mutes the microphone input. */
  readonly MicrophoneVolumeMute: "MicrophoneVolumeMute";
  /** Increases the microphone's input volume. */
  readonly MicrophoneVolumeUp: "MicrophoneVolumeUp";
  /** The Mod key. This is the Command ⌘ on Mac, or the Control key on Windows. */
  readonly Mod: "Mod";
  /** The Mode Change key. Toggles or cycles among input modes of IMEs. */
  readonly ModeChange: "ModeChange";
  /** The numeric keypad's multiplication key, *. */
  readonly Multiply: "Multiply";
  /** Navigates into a submenu or option. */
  readonly NavigateIn: "NavigateIn";
  /** Navigates to the next item. */
  readonly NavigateNext: "NavigateNext";
  /** Navigates out of the current screen or menu. */
  readonly NavigateOut: "NavigateOut";
  /** Navigates to the previous item. */
  readonly NavigatePrevious: "NavigatePrevious";
  /** Creates a new document or message. */
  readonly New: "New";
  /**
   * The Next Candidate function key. Selects the next possible match for the
   * ongoing input.
   */
  readonly NextCandidate: "NextCandidate";
  /** Cycles to the next channel in the favorites list. */
  readonly NextFavoriteChannel: "NextFavoriteChannel";
  /**
   * Cycles to the next saved user profile, if this feature is supported and
   * multiple profiles exist.
   */
  readonly NextUserProfile: "NextUserProfile";
  /**
   * The NonConvert ("Don't convert") key. This accepts the current input method
   * sequence without running conversion when using an IME.
   */
  readonly NonConvert: "NonConvert";
  /** The Notification key. */
  readonly Notification: "Notification";
  /**
   * The NumLock (Number Lock) key. Toggles the numeric keypad between number
   * entry some other mode (often directional arrows).
   */
  readonly NumLock: "NumLock";
  /**
   * Opens the user interface for selecting on demand content or programs to
   * watch.
   */
  readonly OnDemand: "OnDemand";
  /** Opens an existing document or message. */
  readonly Open: "Open";
  /**
   * The Page Down (or PgDn) key. Scrolls down or displays the next page of
   * content.
   */
  readonly PageDown: "PageDown";
  /**
   * The Page Up (or PgUp) key. Scrolls up or displays the previous page of
   * content.
   */
  readonly PageUp: "PageUp";
  /** Starts the process of pairing the remote with a device to be controlled. */
  readonly Pairing: "Pairing";
  /** Paste from the clipboard. */
  readonly Paste: "Paste";
  /**
   * The Pause key. Pauses the current application or state, if applicable. This
   * shouldn't be confused with the "MediaPause" key value, which is used for
   * media controllers, rather than to control applications and processes.
   */
  readonly Pause: "Pause";
  /** A button to move the picture-in-picture view downward. */
  readonly PinPDown: "PinPDown";
  /** A button to control moving the picture-in-picture view. */
  readonly PinPMove: "PinPMove";
  /** Toggles display of th epicture-in-picture view on and off. */
  readonly PinPToggle: "PinPToggle";
  /** A button to move the picture-in-picture view upward. */
  readonly PinPUp: "PinPUp";
  /**
   * The Play key. Resumes a previously paused application, if applicable. This
   * shouldn't be confused with the "MediaPlay" key value, which is used for
   * media controllers, rather than to control applications and processes.
   */
  readonly Play: "Play";
  /** Decreases the media playback rate. */
  readonly PlaySpeedDown: "PlaySpeedDown";
  /** Returns the media playback rate to normal. */
  readonly PlaySpeedReset: "PlaySpeedReset";
  /** Increases the media playback rate. */
  readonly PlaySpeedUp: "PlaySpeedUp";
  /**
   * The Power button or key, to toggle power on and off. Not all systems pass
   * this key through to to the user agent.
   */
  readonly Power: "Power";
  /** The PowerOff or PowerDown key. Shuts off the system. */
  readonly PowerOff: "PowerOff";
  /**
   * The Previous Candidate key. Selects the previous possible match for the
   * ongoing input.
   */
  readonly PreviousCandidate: "PreviousCandidate";
  /** Prints the current document or message. */
  readonly Print: "Print";
  /**
   * The PrintScreen or PrtScr key. Sometimes SnapShot. Captures the screen and
   * prints it or saves it to disk.
   */
  readonly PrintScreen: "PrintScreen";
  /** The Process key. Instructs the IME to process the conversion. */
  readonly Process: "Process";
  /** The Props (Properties) key. */
  readonly Props: "Props";
  /** Toggles random media (also known as "shuffle mode") on and off. */
  readonly RandomToggle: "RandomToggle";
  /**
   * A code sent when the remote control's battery is low. This doesn't actually
   * correspond to a physical key at all.
   */
  readonly RcLowBattery: "RcLowBattery";
  /** Cycles among the available media recording speeds. */
  readonly RecordSpeedNext: "RecordSpeedNext";
  /** Redo the last action. */
  readonly Redo: "Redo";
  /**
   * Toggles radio frequency (RF) input bypass mode on and off. RF bypass mode
   * passes RF input directly to the RF output without any processing or
   * filtering.
   */
  readonly RfBypass: "RfBypass";
  /** The Romaji key; selects the Roman character set. */
  readonly Romaji: "Romaji";
  /** Saves the current document or message. */
  readonly Save: "Save";
  /**
   * Toggles the channel scan mode on and off; this is a mode which flips
   * through channels automatically until the user stops the scan.
   */
  readonly ScanChannelsToggle: "ScanChannelsToggle";
  /** Cycles through the available screen display modes. */
  readonly ScreenModeNext: "ScreenModeNext";
  /** The Scroll Lock key. Toggles beteen scrolling and cursor movement modes. */
  readonly ScrollLock: "ScrollLock";
  /** The Select key. */
  readonly Select: "Select";
  /**
   * The numeric keypad's places separator character (in the United States, this
   * is a comma, but elsewhere it is frequently a period).
   */
  readonly Separator: "Separator";
  /** Toggles display of the device's settings screen on and off. */
  readonly Settings: "Settings";
  /**
   * The Shift key. Modifies keystrokes to allow typing upper (or other) case
   * letters, and to support typing punctuation and other special characters.
   */
  readonly Shift: "Shift";
  /**
   * The Single Candidate key. Enables single candidate mode (as opposed to
   * multi-candidate mode); in this mode, only one candidate is displayed at a
   * time.
   */
  readonly SingleCandidate: "SingleCandidate";
  /** The first general-purpose virtual function key. */
  readonly Soft1: "Soft1";
  /** The second general-purpose virtual function key. */
  readonly Soft2: "Soft2";
  /** The third general-purpose virtual function key. */
  readonly Soft3: "Soft3";
  /** The fourth general-purpose virtual function key. */
  readonly Soft4: "Soft4";
  /**
   * Presents a list of possible corrections for a word which was incorrectly
   * identified.
   */
  readonly SpeechCorrectionList: "SpeechCorrectionList";
  /**
   * Toggles between dictation mode and command/control mode. This lets the
   * speech engine know whether to interpret spoken words as input text or as
   * commands.
   */
  readonly SpeechInputToggle: "SpeechInputToggle";
  /** Starts spell checking the current document. */
  readonly SpellCheck: "SpellCheck";
  /** Toggles split screen display mode on and off. */
  readonly SplitScreenToggle: "SplitScreenToggle";
  /**
   * The Standby key; also known as Suspend or Sleep. This turns off the display
   * and puts the computer in a low power consumption mode, without completely
   * powering off.
   */
  readonly Standby: "Standby";
  /** Cycles among input modes on an external set-top box (STB). */
  readonly STBInput: "STBInput";
  /** Toggles on and off an external STB. */
  readonly STBPower: "STBPower";
  /** Toggles the display of subtitles on and off if they're available. */
  readonly Subtitle: "Subtitle";
  /** The numeric keypad's subtraction key, -. */
  readonly Subtract: "Subtract";
  /** The Super key. */
  readonly Super: "Super";
  /** The Symbol modifier key (found on certain virtual keyboards). */
  readonly Symbol: "Symbol";
  /** The Symbol Lock key. */
  readonly SymbolLock: "SymbolLock";
  /** The Horizontal Tab key, Tab. */
  readonly Tab: "Tab";
  /** Toggles display of teletext, if available. */
  readonly Teletext: "Teletext";
  /** Switches into TV viewing mode. */
  readonly TV: "TV";
  /** Toggles 3D TV mode on and off. */
  readonly TV3DMode: "TV3DMode";
  /** Toggles between antenna and cable inputs. */
  readonly TVAntennaCable: "TVAntennaCable";
  /** Toggles audio description mode on and off. */
  readonly TVAudioDescription: "TVAudioDescription";
  /**
   * Decreases trhe audio description's mixing volume; reduces the volume of the
   * audio descriptions relative to the program sound.
   */
  readonly TVAudioDescriptionMixDown: "TVAudioDescriptionMixDown";
  /**
   * Increases the audio description's mixing volume; increases the volume of
   * the audio descriptions relative to the program sound.
   */
  readonly TVAudioDescriptionMixUp: "TVAudioDescriptionMixUp";
  /**
   * Displays or hides the media contents available for playback (this may be a
   * channel guide showing the currently airing programs, or a list of media
   * files to play).
   */
  readonly TVContentsMenu: "TVContentsMenu";
  /** Displays or hides the TV's data service menu. */
  readonly TVDataService: "TVDataService";
  /** Cycles the input mode on an external TV. */
  readonly TVInput: "TVInput";
  /** Switches to the input "Component 1." */
  readonly TVInputComponent1: "TVInputComponent1";
  /** Switches to the input "Component 2." */
  readonly TVInputComponent2: "TVInputComponent2";
  /** Switches to the input "Composite 1." */
  readonly TVInputComposite1: "TVInputComposite1";
  /** Switches to the input "Composite 2." */
  readonly TVInputComposite2: "TVInputComposite2";
  /** Switches to the input "HDMI 1." */
  readonly TVInputHDMI1: "TVInputHDMI1";
  /** Switches to the input "HDMI 2." */
  readonly TVInputHDMI2: "TVInputHDMI2";
  /** Switches to the input "HDMI 3." */
  readonly TVInputHDMI3: "TVInputHDMI3";
  /** Switches to the input "HDMI 4." */
  readonly TVInputHDMI4: "TVInputHDMI4";
  /** Switches to the input "VGA 1." */
  readonly TVInputVGA1: "TVInputVGA1";
  /** The Media Context menu key. */
  readonly TVMediaContext: "TVMediaContext";
  /** Toggle the TV's network connection on and off. */
  readonly TVNetwork: "TVNetwork";
  /** Put the TV into number entry mode. */
  readonly TVNumberEntry: "TVNumberEntry";
  /** The device's power button. */
  readonly TVPower: "TVPower";
  /** Radio button. */
  readonly TVRadioService: "TVRadioService";
  /** Satellite button. */
  readonly TVSatellite: "TVSatellite";
  /** Broadcast Satellite button. */
  readonly TVSatelliteBS: "TVSatelliteBS";
  /** Communication Satellite button. */
  readonly TVSatelliteCS: "TVSatelliteCS";
  /** Toggles among available satellites. */
  readonly TVSatelliteToggle: "TVSatelliteToggle";
  /**
   * Selects analog terrestrial television service (analog cable or antenna
   * reception).
   */
  readonly TVTerrestrialAnalog: "TVTerrestrialAnalog";
  /**
   * Selects digital terrestrial television service (digital cable or antenna
   * receiption).
   */
  readonly TVTerrestrialDigital: "TVTerrestrialDigital";
  /** Timer programming button. */
  readonly TVTimer: "TVTimer";
  /** Undo the last action. */
  readonly Undo: "Undo";
  /**
   * The user agent wasn't able to map the event's virtual keycode to a specific
   * key value. This can happen due to hardware or software constraints, or
   * because of constraints around the platform on which the user agent is
   * running.
   */
  readonly Unidentified: "Unidentified";
  /** Cycles through the available video modes. */
  readonly VideoModeNext: "VideoModeNext";
  /** The Voice Dial key. Initiates voice dialing. */
  readonly VoiceDial: "VoiceDial";
  /**
   * The WakeUp key; used to wake the computer from the hibernation or standby
   * modes.
   */
  readonly WakeUp: "WakeUp";
  /**
   * Causes the device to identify itself in some fashion, such as by flashing a
   * light, briefly changing the brightness of indicator lights, or emitting a
   * tone.
   */
  readonly Wink: "Wink";
  /** The Zenkaku (full width) characters key. */
  readonly Zenkaku: "Zenkaku";
  /** The Zenkaku/Hankaku (full width/half width) toggle key. */
  readonly ZenkakuHanaku: "ZenkakuHanaku";
  /** The ZoomIn key. */
  readonly ZoomIn: "ZoomIn";
  /** The ZoomOut key. */
  readonly ZoomOut: "ZoomOut";
  /**
   * Toggles between full-screen and scaled content display, or otherwise change
   * the magnification level.
   */
  readonly ZoomToggle: "ZoomToggle";
};
//#endregion
//#region src/internal/types.d.ts
type FormTags = 'INPUT' | 'input' | 'SELECT' | 'select' | 'TEXTAREA' | 'textarea';
type Hotkey = {
  keys?: readonly string[];
  description?: string;
  scopes?: Scopes;
} & KeyboardModifiers;
type HotkeyCallback = (keyboardEvent: KeyboardEvent, hotkeysEvent: HotkeysEvent) => void;
type HotkeysEvent = Hotkey;
type KeyboardModifiers = {
  alt?: boolean;
  ctrl?: boolean;
  meta?: boolean;
  mod?: boolean;
  shift?: boolean;
  useKey?: boolean;
};
type Keys = (({} & string) | keyof typeof Key)[][] | readonly string[] | string;
type Options = {
  delimiter?: string;
  description?: string;
  document?: Document;
  enabled?: Trigger;
  enableOnContentEditable?: boolean;
  enableOnFormTags?: readonly FormTags[] | boolean;
  ignoreEventWhenPrevented?: boolean;
  ignoreModifiers?: boolean;
  keydown?: boolean;
  keyup?: boolean;
  preventDefault?: Trigger;
  scopes?: Scopes;
  splitKey?: string;
  useKey?: boolean;
  ignoreEventWhen?: (e: KeyboardEvent) => boolean;
};
type OptionsOrDependencyArray = DependencyList | Options;
type Scopes = readonly string[] | string;
type Trigger = ((keyboardEvent: KeyboardEvent, hotkeysEvent: HotkeysEvent) => boolean) | boolean;
//#endregion
//#region src/internal/HotkeysProvider.d.ts
type HotkeysContextType = {
  activeScopes: string[];
  hotkeys: readonly Hotkey[];
  disableScope: (scope: string) => void;
  enableScope: (scope: string) => void;
  toggleScope: (scope: string) => void;
};
declare const useHotkeysContext: () => HotkeysContextType;
type Props = {
  children: ReactNode;
  initiallyActiveScopes?: string[];
};
declare const HotkeysProvider: ({
  children,
  initiallyActiveScopes
}: Props) => React.JSX.Element;
//#endregion
//#region src/internal/isHotkeyPressed.d.ts
declare function isHotkeyPressed(key: readonly string[] | string, delimiter?: string): boolean;
//#endregion
//#region src/internal/useHotkeys.d.ts
declare function useHotkeys<T extends HTMLElement>(keys: Keys, callback: HotkeyCallback, options?: OptionsOrDependencyArray, dependencies?: OptionsOrDependencyArray): RefCallback<T>;
//#endregion
//#region src/internal/useRecordHotkeys.d.ts
declare function useRecordHotkeys(): readonly [Set<string>, {
  readonly isRecording: boolean;
  readonly resetKeys: () => void;
  readonly start: () => void;
  readonly stop: () => void;
}];
//#endregion
export { type HotkeyCallback, type HotkeysEvent, type Options as HotkeysOptions, HotkeysProvider, Key, type Keys, isHotkeyPressed, useHotkeys, useHotkeysContext, useRecordHotkeys };