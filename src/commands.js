/**
 * Represents a bot command.
 */
class BotCommand {
  /**
   * Creates a new command.
   * You must register it with Core.commands.register(command) to make it work.
   * @param {string} name - Command name. MUST be in lowercase and contain no spaces
   * @param {object} options - Command options
   * @param {string[]} options.aliases - Command aliases
   * @param {boolean} options.adminOnly - Restrict this command to administrators
   * @param {boolean} options.djOnly - Restrict this command to DJs
   * @param {boolean} options.ownerOnly - Restrict this command to the owner
   * @param {boolean} options.argSeparator - The argument delimiter
   * @param {boolean} options.includeCommandNameInArgs - Useful for aliases
   * @param {boolean} options.allowDM - Allow this command to be executed in DMs
   * @param {boolean} options.everyone - For SelfBots, allow this command to be executed by others.
   * @param {function} func - Command handler
   */
  constructor (name, options, func) {
    /** Command name */
    this.name = name
    if (!name) throw new Error('You must specify a command name!')
    if (typeof options === 'function') {
      // Function as 2nd argument
      this.func = options
    } else if (typeof options === 'object') {
      Object.assign(this, options)
      this.func = func
    }
  }

  /**
   * Calls the command handler.
   * @param {object} msg - Message object
   * @param {string|string[]} args - Arguments
   */
  exec (msg, args) {
    Core.guilds.getGuild(msg.guild).then(data => this.func(msg, args, data, Core.bot, Core))
    .catch(err => Core.log(err, 2))
  }
}

/**
 * Manages the commands.
 */
class CommandManager {
  /**
   * Instantiates a new command manager.
   */
  constructor () {
    /** Registered commands */
    this.registered = {}
    /** Registered commands including aliases */
    this.plain = {}
  }

  /**
   * Registers command(s).
   * First parameter can be either a name, or a {BotCommand} instance or array.
   * Second parameter can be an object containg settings, or the handler function.
   * Third parameter is the handler function when settings are the second.
   *
   * If a command with the same name exists, it will be overwritten.
   *
   * @param {string} name - Name of the command
   * @param {object} options - Command options
   * @param {function} func - Function to execute
   * @returns {BotCommand|BotCommand[]} The registered command instance(s).
   * @see {BotCommand}
   */
  register (name, options, func) {
    // Arrays can be used as first parameters
    if (name.forEach && !options && !func) {
      const r = []
      name.forEach(command => r.push(this.register(command)))
      return r
    }
    // Command instances can be used as first parameters
    const command = (name instanceof BotCommand) ? name : new BotCommand(name, options, func)
    this.registered[command.name] = command
    this.plain[command.name] = command
    // :D
    if (command.aliases && command.aliases.forEach) {
      command.aliases.forEach((alias) => {
        this.plain[alias] = command
      })
    }
    return command
  }

  /**
   * Unregisters command(s)
   * First parameter can be either a name, a {BotCommand} instance or an array of both.
   * @param {string|BotCommand|Array} c - Command(s) to unregister.
   */
  unregister (c) {
    // Arrays
    if (c.forEach) {
      const r = []
      c.forEach(command => r.push(this.unregister(command)))
      return r
    }
    const command = (c instanceof BotCommand) ? c : this.commands[c]
    if (command && command.name && this.registered[command.name]) {
      if (command.aliases && command.aliases.forEach) {
        command.aliases.forEach((alias) => {
          delete this.plain[alias]
        })
      }
      delete this.registered[command.name]
      delete this.plain[command.name]
      return true
    }
    return false
  }

  /**
   * Processes a message.
   */
  processMessage (msg) {
    // Check if command execution is allowed
    Core.guilds.getGuild(msg.guild).then(g => {
      // Check if command execution is not restricted
      if (g.data.restrict && !Core.permissions.isDJ(msg.member)) return
      // Global prefix
      let pfx = Core.settings.prefix
      // Public SelfBot prefix
      if (Core.settings.selfBot && Core.settings.publicPrefix && msg.author.id !== Core.bot.User.id) {
        pfx = Core.settings.publicPrefix
      }
      // Guild Prefix
      if (g.data.prefix && msg.content.toLowerCase().indexOf(g.data.prefix.toLowerCase()) === 0) {
        pfx = g.data.prefix
      }
      // Return if the message contains no prefix
      if (msg.content.slice(0, pfx.length).toLowerCase() !== pfx.toLowerCase()) return
      // Get the command
      const c = msg.content.slice(pfx.length).split(' ')[0].toLowerCase().trim()
      const command = this.plain[c] 
      if (!command) return
      // Arguments
      let args = msg.content.slice(pfx.length + c.length).trim()
      if (command.argSeparator) args = args.split(command.argSeparator)
      // Run the command!
      try {
        this.run(command, msg, args)
      } catch (e) {
        Core.log(e, 2)
      }
    })
  }

  /**
   * Executes a command.
   * @param {string} name - Name of the command
   * @param {object} msg - Discordie IMessage
   * @param {string|string[]} args - Arguments
   */
  run (n, msg, args) {
    // Get the command
    const command = (n instanceof BotCommand) ? n : this.plain[n]
    const name = (n instanceof BotCommand) ? n.name : n
    if (!command) return false
    // Check if it can be executed
    if (!msg.guild && !command.allowDM) return
    if (Core.settings.selfBot && !command.everyone && msg.author.id !== Core.bot.User.id) return
    if (command.adminOnly && !Core.permissions.isAdmin(msg.author, msg.guild)) return
    if (command.djOnly && !Core.permissions.isDJ(msg.author, msg.guild)) return
    if (command.ownerOnly && !Core.permissions.isOwner(msg.author)) return
    let a = args
    if (command.includeCommandNameInArgs) {
      a = [ name ].concat(args)
    }
    command.exec(msg, a)
  }
}

module.exports = CommandManager
global.BotCommand = BotCommand
