import os
import sys
import subprocess
import argparse
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}=== {text} ==={Colors.ENDC}")

def print_success(text):
    print(f"{Colors.GREEN}[+] {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.WARNING}[!] {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.FAIL}[x] {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.BLUE}[i] {text}{Colors.ENDC}")

def print_cmd(text):
    print(f"{Colors.BOLD}{Colors.BLUE}  $ {text}{Colors.ENDC}")

skills_lock = threading.Lock()
print_lock = threading.Lock()

def check_dependencies():
    dependencies = {
        "npm": "npm --version",
        "npx": "npx --version",
    }
    all_ok = True
    for name, cmd in dependencies.items():
        try:
            res = subprocess.run(cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if res.returncode != 0:
                print_warning(f"'{name}' returned a non-zero exit status.")
                all_ok = False
            else:
                print_success(f"Dependency check: '{name}' is installed.")
        except Exception:
            print_error(f"Dependency check: '{name}' is NOT installed or NOT in your PATH.")
            all_ok = False
    return all_ok

def run_command(command, description):
    print_info(f"Running: {description}")
    print(f"> {command}")
    try:
        process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1, encoding='utf-8', errors='replace')
        if process.stdout:
            for line in process.stdout:
                print(f"  {line.strip()}")
        process.wait()
        if process.returncode == 0:
            print_success(f"Completed: {description}\n")
            return True
        else:
            print_warning(f"Warning: command returned code {process.returncode} for: {description}\n")
            return False
    except Exception as e:
        print_error(f"Error running command: {e}\n")
        return False

def run_command_captured(command, description):
    try:
        process = subprocess.Popen(
            command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding='utf-8',
            errors='replace'
        )
        output_lines = []
        if process.stdout:
            for line in process.stdout:
                output_lines.append(line.strip())
        process.wait()
        success = (process.returncode == 0)
        return success, output_lines
    except Exception as e:
        return False, [f"Error executing process: {e}"]

def run_command_parallel_worker(command, description, needs_skills_lock=False):
    if needs_skills_lock:
        with skills_lock:
            return run_command_captured(command, description)
    else:
        return run_command_captured(command, description)

def main():
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
            sys.stderr.reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass

    if os.name == 'nt':
        os.system('')

    parser = argparse.ArgumentParser(description="Bootstrap skills and tools in your project.")
    parser.add_argument("-y", "--yes", action="store_true", help="Auto-accept all prompts (non-interactive mode)")
    args = parser.parse_args()

    print_header("SKILLS & AGENT BOOTSTRAPPER (PARALLEL MODE)")

    cwd = os.getcwd()
    print_info(f"Current working directory: {cwd}")

    if cwd.lower() == r"c:\users\hp" or cwd.lower() == r"c:/users/hp":
        print_warning("You are executing this script directly in your home directory!")
        print("It is highly recommended to run this script inside a specific project folder.")
        if args.yes:
            print_warning("Bypassing safety warning due to --yes / non-interactive mode.")
        else:
            choice = input("Do you want to proceed with installing in your home directory? (y/N): ").strip().lower()
            if choice != 'y':
                print_error("Execution aborted by user.")
                sys.exit(1)

    print_header("Checking Dependencies")
    if not check_dependencies():
        print_warning("Some dependencies are missing. Commands might fail if not installed.")
        if args.yes:
            print_warning("Proceeding anyway due to --yes / non-interactive mode.")
        else:
            choice = input("Do you want to proceed anyway? (y/N): ").strip().lower()
            if choice != 'y':
                print_error("Execution aborted.")
                sys.exit(1)

    if not os.path.exists(".git"):
        print_header("Git Initialization")
        print("A git repository was not detected. Many agent tools require Git.")
        should_git_init = False
        if args.yes:
            print_info("Auto-initializing Git repository...")
            should_git_init = True
        else:
            choice = input("Would you like to initialize git here? (y/N): ").strip().lower()
            if choice == 'y':
                should_git_init = True
        if should_git_init:
            run_command("git init", "Initializing git repository")

    if not os.path.exists("package.json"):
        print_header("NPM Package Initialization")
        print("No package.json found. NPX skills work best in a node project.")
        should_npm_init = False
        if args.yes:
            print_info("Auto-initializing NPM project...")
            should_npm_init = True
        else:
            choice = input("Would you like to initialize a package.json? (y/N): ").strip().lower()
            if choice == 'y':
                should_npm_init = True
        if should_npm_init:
            run_command("npm init -y", "Initializing package.json")

    print_header("Installing Skills (Concurrently)")

    impeccable_cmd = "npx -y impeccable install -y" if args.yes else "npx impeccable install"

    tasks = [
        ("npx -y skills add https://github.com/greensock/gsap-skills", "Add GSAP animation skills", True),
        ("npx -y skills add nutlope/hallmark", "Add Hallmark design system skill", True),
        ("npx -y skills add https://github.com/Leonxlnx/taste-skill", "Add Taste Skill (13 variants)", True),
        ("npx -y skills@latest add emilkowalski/skills", "Add Emil Kowalski's skills", True),
        (impeccable_cmd, "Install Impeccable design engine", False),
    ]

    with ThreadPoolExecutor(max_workers=len(tasks)) as executor:
        future_to_desc = {
            executor.submit(run_command_parallel_worker, cmd, desc, lock_req): desc
            for cmd, desc, lock_req in tasks
        }

        for future in as_completed(future_to_desc):
            desc = future_to_desc[future]
            try:
                success, logs = future.result()
                with print_lock:
                    if success:
                        print_success(f"Successfully Completed: {desc}")
                    else:
                        print_error(f"Failed or Completed with Warnings: {desc}")

                    if logs:
                        print(f"--- Logs for {desc} ---")
                        for line in logs:
                            print(f"  {line}")
                        print("-----------------------\n")
            except Exception as exc:
                with print_lock:
                    print_error(f"{desc} threw an exception: {exc}")

    print_header("Setup Complete!")
    print_success("All skills have been successfully installed!")
    print()
    print(f"{Colors.BOLD}Template-embedded skills (always available — .agents/):{Colors.ENDC}")
    print("  .agents/design-basics/          - Design fundamentals")
    print("  .agents/premium-design/          - Premium UI design")
    print("  .agents/performance_engineering/ - Performance optimization")
    print("  .agents/ui-checklist/            - UI/UX completeness checklists")
    print()
    print(f"{Colors.BOLD}Installed skills (from GitHub — .agents/skills/):{Colors.ENDC}")
    print("  .agents/skills/gsap-*/          - GSAP animation skills (8)")
    print("  .agents/skills/hallmark/        - Hallmark design system")
    print("  .agents/skills/*                - Taste skills (13)")
    print("  .agents/skills/*                - Emil Kowalski skills (6)")
    print()
    print(f"{Colors.BOLD}Design Resources — DESIGN.md:{Colors.ENDC}")
    print("  Curated premium libraries: Animata, Cult UI, Skipper UI, Astryx (Meta), HeroUI, COSS UI")
    print("  Premium animated: React Bits Pro, Aceternity, MagicUI, beUI Pro, Velocity UI, FutureUI")
    print("  Animation: Motion (Framer), GSAP, React Spring")
    print()
    print(f"{Colors.BOLD}Next Steps — Install Spec Kit:{Colors.ENDC}")
    print("  Spec Kit provides the /speckit.* workflow commands for SDLC.")
    print("  You MUST run specify AFTER Skills.py to unlock SDLC commands.")
    print()
    print("  1. Install uv (if not installed):")
    print_cmd("powershell -ExecutionPolicy ByPass -c \"irm https://astral.sh/uv/install.ps1 | iex\"")
    print()
    print("  2. Install specify-cli globally via uv:")
    print_cmd("uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@latest")
    print()
    print("  3. Initialize Spec Kit in your project (run from project root):")
    print_cmd("specify init .")
    print()
    print("  After installation, follow the instructions printed by specify init.")
    print("  This generates AGENTS.md/CLAUDE.md with the speckit.* commands.")
    print("  If you are using Cursor, Claude Code, or Gemini CLI,")
    print("  please reload/restart the tool to load the new skills.")

if __name__ == "__main__":
    main()