# Contributing to MinecraftBuildMCP

Thank you for considering contributing to MinecraftBuildMCP! This document outlines the process for contributing to this project.

## How to Contribute

1. **Fork the Repository**
   - Fork the repository to your GitHub account

2. **Clone Your Fork**
   ```sh
   git clone https://github.com/your-username/minecraft-mcp-server-pixel.git
   cd minecraft-mcp-server-pixel
   ```

3. **Create a Branch**
   ```sh
   git checkout -b feature/your-feature-name
   ```

4. **Make Your Changes**
   - Add or modify code
   - Update documentation
   - Add tests if applicable

5. **Test Your Changes**
   - Make sure the bot still functions correctly
   - Build the project with `npm run build`
   - Test with a live Minecraft instance

6. **Commit Your Changes**
   ```sh
   git add .
   git commit -m "Description of the changes"
   ```

7. **Push to Your Fork**
   ```sh
   git push origin feature/your-feature-name
   ```

8. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template

## Development Guidelines

### Code Style

- Follow TypeScript best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Documentation

- Update README.md if you add new features
- Document new commands in schema.md
- Add examples for new functionality to examples.md

### Testing

- Test all functionality with a running Minecraft instance
- Verify compatibility with Creative and Survival modes
- Test with different Minecraft versions if possible

## Contributor Team Structure

Our project uses a collaborative team approach with designated roles:

- **Core Developers**: Maintain the codebase, review PRs
- **Documentation Team**: Keep docs updated and accessible
- **Feature Developers**: Work on new features and enhancements
- **Bug Hunters**: Find and fix issues in the codebase

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

Thank you for helping improve MinecraftBuildMCP!
